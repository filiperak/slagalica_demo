import { Socket } from "socket.io";
import Page from "../Page.js";
import { Store, GameState } from "../Store.js";
import { RouerFn } from "../util/Types.js";
import { SOCKET_EVENTS, VIEWS } from "../util/ClientConstants.js";
import { Partial } from "../util/Partials.js";
import { FetchHTML } from "../util/FetchHTML.js";

interface LocalDomElements {
    checkWord: HTMLButtonElement;
    submitAnswer: HTMLButtonElement;
    clearBtn: HTMLButtonElement;
    keyboard: HTMLElement;
    inputContainer: HTMLElement;
    wordStatus: HTMLElement;
}

interface GameData {
    letters: string[];
    targetWord: string;
    gameId: string;
}

interface InputLetter {
    letter: string;
    id: string;
}

const KEY_MAP: Record<number, string> = {
    65: "A", 66: "B", 67: "C", 68: "D", 69: "E", 70: "F",
    71: "G", 72: "H", 73: "I", 74: "J", 75: "K", 76: "L",
    77: "M", 78: "N", 79: "O", 80: "P", 82: "R", 83: "S",
    84: "T", 85: "U", 86: "V", 90: "Z",
};

export class Slagalica extends Page {

    private _localDom!: LocalDomElements;
    private _gameData!: GameData;

    // State
    private _inputWord: InputLetter[] = [];
    private _submitted: boolean = false;

    // Bound listener refs (needed for cleanup)
    private _onKeyDown!: (e: KeyboardEvent) => void;
    private _onKeyUp!: (e: KeyboardEvent) => void;
    private _onWordCheckResult!: (data: { validated: boolean }) => void;

    constructor(socket: Socket, store: Store, router: RouerFn, partial: Partial) {
        super(socket, store, router, partial);
    }

    async init() {
        super.init();
        this._submitted = false;
        this._inputWord = [];

        this._domElements.gameContainer.innerHTML = await FetchHTML("../views/slagalica.html");

        this._localDom = {
            checkWord:       document.querySelector("#checkWord")!,
            submitAnswer:    document.querySelector("#submitAnswer")!,
            clearBtn:        document.querySelector("#clearBtn")!,
            keyboard:        document.querySelector("#keyboard")!,
            inputContainer:  document.querySelector("#input")!,
            wordStatus:      document.querySelector("#wordStatus")!,
        };

        const state = this._store.getState__();
        this._gameData = {
            letters:    state?.gameState.slagalica.letterComb ?? [],
            targetWord: state?.gameState.slagalica.word ?? "",
            gameId: state?.gameId ?? ""
        };

        this._renderKeyboard__();
        this._renderInputWord__();
        this._bindEvents__();

        this.initHeader__({
            durationSeconds: 90,
            timeoutMessage:  "Vreme za Slagalicu je isteklo!",
            description:     "Slagalica",
            backMessage:     "Da li ste sigurni da želite da napustite Slagalicu?",
        });
    }

    // ─── Rendering ────────────────────────────────────────────────────────────

    /**
     * Builds the clickable letter grid from gameData.letters.
     * Each button gets a unique id ("letter-0", "letter-1", ...) so we can
     * hide it when it's been added to the input word.
     */
    private _renderKeyboard__(): void {
        this._localDom.keyboard.innerHTML = "";

        this._gameData.letters.forEach((letter, index) => {
            const btn = document.createElement("button");
            const id = `letter-${index}`;
            btn.id = id;
            btn.textContent = letter;
            btn.className = [
                "letter-btn",
                "w-16 h-14 flex items-center justify-center",
                "bg-[#2b2d31] border border-white/[0.06]",
                "hover:border-[#5865f2]/60 hover:bg-[#313338]",
                "rounded-lg text-[#dbdee1] hover:text-white",
                "font-bold text-base transition-all active:scale-95 shadow-sm",
            ].join(" ");

            this.addEvents__(btn, "click", () => this._onLetterClick__(letter, id));
            this._localDom.keyboard.appendChild(btn);
        });
    }

    /**
     * Re-renders the input tile row. Called after every change to _inputWord.
     */
    private _renderInputWord__(): void {
        const tilesRow = document.querySelector("#tilesRow") as HTMLElement;
        const clearBtn = document.querySelector("#clearBtn") as HTMLElement;

        // Clear only the tiles
        tilesRow.innerHTML = "";

        // Show / hide clear button
        clearBtn?.classList.toggle("hidden", this._inputWord.length === 0);

        // Render one tile per letter
        this._inputWord.forEach(({ letter }) => {
            const tile = document.createElement("div");
            tile.className = [
                "w-11 h-11 flex items-center justify-center",
                "bg-[#313338] border border-[#5865f2]/60 rounded",
                "text-white font-bold text-lg",
                "shadow-[0_0_8px_rgba(88,101,242,0.2)]",
            ].join(" ");
            tile.textContent = letter;
            tilesRow.appendChild(tile);
        });
    }
    // ─── Letter interaction ────────────────────────────────────────────────────

    private _onLetterClick__(letter: string, id: string): void {
        this._clearStatus__();
        this._inputWord.push({ letter, id });
        // Hide the keyboard button so the same physical letter can't be used twice
        document.getElementById(id)?.classList.add("invisible");
        this._renderInputWord__();
    }

    private _deleteLastLetter__(): void {
        if (this._inputWord.length === 0) return;
        this._clearStatus__();

        const last = this._inputWord.pop()!;
        // Restore the keyboard button
        document.getElementById(last.id)?.classList.remove("invisible");
        this._renderInputWord__();
    }

    // ─── Word actions ──────────────────────────────────────────────────────────

    private _checkWord__(): void {
        const word = this._getWord__();
        if (!word) return;

        this._socket.emit(SOCKET_EVENTS.GAMES.SLAGALICA.CHECK, {
            gameId: this._gameData.gameId,
            word,
        });

        // Show spinner while waiting
        this._setStatus__(
            `<span class="inline-flex gap-1">
                <span class="w-1.5 h-1.5 bg-[#5865f2] rounded-full animate-bounce"></span>
                <span class="w-1.5 h-1.5 bg-[#5865f2] rounded-full animate-bounce [animation-delay:150ms]"></span>
                <span class="w-1.5 h-1.5 bg-[#5865f2] rounded-full animate-bounce [animation-delay:300ms]"></span>
            </span>`
        );
    }

    private _submit__(): void {
        if (this._submitted) return;

        this.onGameComplete__("Potvrdi rezultat", () => {
            this._submitted = true;
            const word = this._getWord__();

            this._socket.emit(SOCKET_EVENTS.GAMES.SLAGALICA.SUBMIT, {
                gameId: this._store.getState__()?.gameId,
                word,
            });

            // Clean up keyboard & body listeners — game is over
            this._removeBodyListeners__();
            //this.go(VIEWS.MOJ_BROJ);
        });
    }

    // ─── Event binding ─────────────────────────────────────────────────────────

    private _bindEvents__(): void {
        // Button events (managed by Page.addEvents__ for auto-cleanup)
        this.addEvents__(this._localDom.clearBtn,     "click", () => this._deleteLastLetter__());
        this.addEvents__(this._localDom.checkWord,    "click", () => this._checkWord__());
        this.addEvents__(this._localDom.submitAnswer, "click", () => this._submit__());


        // Socket listener
        this._onWordCheckResult = (data: { validated: boolean }) => {
            if (data.validated) {
                this._setStatus__(`<span class="text-[#23a55a]">👍 Reč je prihvaćena</span>`);
            } else {
                this._setStatus__(`<span class="text-[#f23f42]">❌ Reč nije prihvaćena</span>`);
            }
        };
         this._socket.on("wordCheckResult", this._onWordCheckResult);

        // Keyboard shortcuts
        this._onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Backspace") this._deleteLastLetter__();
            if (e.key === "Enter")     this._submit__();
        };

        this._onKeyUp = (e: KeyboardEvent) => {
            const letter = KEY_MAP[e.keyCode];
            if (!letter || !this._gameData.letters.includes(letter)) return;

            // Find the first visible keyboard button for this letter
            const btn = Array.from(
                document.querySelectorAll<HTMLElement>(".letter-btn")
            ).find(el =>
                el.textContent === letter && !el.classList.contains("invisible")
            );

            if (btn) {
                this._clearStatus__();
                this._inputWord.push({ letter, id: btn.id });
                btn.classList.add("invisible");
                this._renderInputWord__();
            }
        };

        document.body.addEventListener("keydown", this._onKeyDown);
        document.body.addEventListener("keyup",   this._onKeyUp);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private _getWord__(): string {
        return this._inputWord.map(l => l.letter).join("");
    }

    private _setStatus__(html: string): void {
        if (this._localDom.wordStatus) {
            this._localDom.wordStatus.innerHTML = html;
        }
    }

    private _clearStatus__(): void {
        this._setStatus__("");
    }

    private _removeBodyListeners__(): void {
        document.body.removeEventListener("keydown", this._onKeyDown);
        document.body.removeEventListener("keyup",   this._onKeyUp);
        // this._socket.off(SOCKET_EVENTS.WORD_CHECK_RESULT, this._onWordCheckResult);
    }

    /**
     * Called by Page.dispose__() on route change — cleans up body listeners
     * and socket subscriptions that aren't managed by Page's _events array.
     */
    override dispose__(): void {
        this._removeBodyListeners__();
        super.dispose__();
    }
}
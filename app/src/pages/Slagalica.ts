import { Socket } from "socket.io-client";
import Page from "../Page";
import { Store, GameState } from "../Store";
import { RouerFn } from "../util/Types";
import { SOCKET_EVENTS, VIEWS } from "../util/ClientConstants";
import { Partial } from "../util/Partials";
import { FetchHTML } from "../util/FetchHTML";

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

    private _inputWord: InputLetter[] = [];
    private _submitted: boolean = false;

    constructor(socket: Socket, store: Store, router: RouerFn, partial: Partial) {
        super(socket, store, router, partial);
    }

    async init() {
        super.init();
        this._submitted = false;
        this._inputWord = [];

        this._domElements.gameContainer.innerHTML = await FetchHTML("/views/slagalica.html");

        this._localDom = {
            checkWord:      document.querySelector("#checkWord")!,
            submitAnswer:   document.querySelector("#submitAnswer")!,
            clearBtn:       document.querySelector("#clearBtn")!,
            keyboard:       document.querySelector("#keyboard")!,
            inputContainer: document.querySelector("#input")!,
            wordStatus:     document.querySelector("#wordStatus")!,
        };

        const state = this._store.getState__();
        this._gameData = {
            letters:    state?.gameState.slagalica.letterComb ?? [],
            targetWord: state?.gameState.slagalica.word ?? "",
            gameId:     state?.gameId ?? "",
        };

        this._renderKeyboard__();
        this._renderInputWord__();

        this.addEvents__(this._localDom.clearBtn,     "click", this._deleteLastLetter__.bind(this));
        this.addEvents__(this._localDom.checkWord,    "click", this._checkWord__.bind(this));
        this.addEvents__(this._localDom.submitAnswer, "click", this._submit__.bind(this));
        this.addEvents__(document.body, "keydown", this._onKeyDown__.bind(this) as EventListener);
        this.addEvents__(document.body, "keyup",   this._onKeyUp__.bind(this) as EventListener);

        this.addSocketEvents__("wordCheckResult", this._onWordCheckResult__.bind(this));

        this.initHeader__({
            durationSeconds: 90,
            timeoutMessage:  "Vreme za Slagalicu je isteklo!",
            description:     "Slagalica",
            backMessage:     "Da li ste sigurni da želite da napustite Slagalicu?",
        });
    }


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
                "bg-surface-raised border border-white/[0.06]",
                "hover:border-brand/60 hover:bg-surface-overlay",
                "rounded-lg text-content hover:text-white",
                "font-bold text-base transition-all active:scale-95 shadow-sm",
            ].join(" ");

            this.addEvents__(btn, "click", this._onLetterClick__.bind(this, letter, id));
            this._localDom.keyboard.appendChild(btn);
        });
    }

    private _renderInputWord__(): void {
        const tilesRow = document.querySelector("#tilesRow") as HTMLElement;
        const clearBtn = document.querySelector("#clearBtn") as HTMLElement;

        tilesRow.innerHTML = "";
        clearBtn?.classList.toggle("hidden", this._inputWord.length === 0);

        this._inputWord.forEach(({ letter }) => {
            const tile = document.createElement("div");
            tile.className = [
                "w-11 h-11 flex items-center justify-center",
                "bg-surface-overlay border border-brand/60 rounded",
                "text-white font-bold text-lg",
                "shadow-[0_0_8px_rgba(88,101,242,0.2)]",
            ].join(" ");
            tile.textContent = letter;
            tilesRow.appendChild(tile);
        });
    }

    private _onLetterClick__(letter: string, id: string): void {
        this._clearStatus__();
        this._inputWord.push({ letter, id });
        document.getElementById(id)?.classList.add("invisible");
        this._renderInputWord__();
    }

    private _onKeyDown__(e: KeyboardEvent): void {
        if (e.key === "Backspace") this._deleteLastLetter__();
        if (e.key === "Enter")     this._submit__();
    }

    private _onKeyUp__(e: KeyboardEvent): void {
        const letter = KEY_MAP[e.keyCode];
        if (!letter || !this._gameData.letters.includes(letter)) return;

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
    }

    private _onWordCheckResult__(data: { validated: boolean }): void {
        if (data.validated) {
            this._setStatus__(`<span class="text-positive">👍 Reč je prihvaćena</span>`);
        } else {
            this._setStatus__(`<span class="text-negative">❌ Reč nije prihvaćena</span>`);
        }
    }

    private _deleteLastLetter__(): void {
        if (this._inputWord.length === 0) return;
        this._clearStatus__();
        const last = this._inputWord.pop()!;
        document.getElementById(last.id)?.classList.remove("invisible");
        this._renderInputWord__();
    }

    private _checkWord__(): void {
        const word = this._getWord__();
        if (!word) return;

        this._socket.emit(SOCKET_EVENTS.GAMES.SLAGALICA.CHECK, {
            gameId: this._gameData.gameId,
            word,
        });

        this._setStatus__(
            `<span class="inline-flex gap-1">
                <span class="w-1.5 h-1.5 bg-brand rounded-full animate-bounce"></span>
                <span class="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:150ms]"></span>
                <span class="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:300ms]"></span>
            </span>`
        );
    }

    private _submit__(): void {
        if (this._submitted) return;

        this.onGameComplete__("Potvrdi rezultat", () => {
            this._submitted = true;
            this._socket.emit(SOCKET_EVENTS.GAMES.SLAGALICA.SUBMIT, {
                gameId: this._store.getState__()?.gameId,
                word:   this._getWord__(),
            });
        });
    }

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
}
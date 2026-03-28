import { Socket } from "socket.io-client";
import Page from "../Page";
import { Store } from "../Store";
import { GAME_KEYS, SOCKET_EVENTS } from "../util/ClientConstants";
import { Partial } from "../util/Partials";
import { FetchHTML } from "../util/Util";
import { I18nService } from "../I18n";
import App from "../App";

interface LocalDomElements {
    checkWord: HTMLButtonElement;
    submitAnswer: HTMLButtonElement;
    stopShufle: HTMLButtonElement;
    clearBtn: HTMLButtonElement;
    keyboard: HTMLElement;
    inputContainer: HTMLElement;
    wordStatus: HTMLElement;
}

interface GameData {
    letters: string[];
    gameId: string;
}

interface InputLetter {
    letter: string;
    id: string;
}

const KEY_MAP: Record<number, string> = {
    65: "A",
    66: "B",
    67: "C",
    68: "D",
    69: "E",
    70: "F",
    71: "G",
    72: "H",
    73: "I",
    74: "J",
    75: "K",
    76: "L",
    77: "M",
    78: "N",
    79: "O",
    80: "P",
    82: "R",
    83: "S",
    84: "T",
    85: "U",
    86: "V",
    90: "Z",
};

export class Slagalica extends Page {
    private _localDom!: LocalDomElements;
    private _gameData!: GameData;
    private _partial: Partial;

    private _inputWord: InputLetter[] = [];
    private _submitted: boolean = false;
    private _shuffleIntervals: ReturnType<typeof setInterval>[] = [];
    private _shuffling: boolean = true;

    constructor(socket: Socket, store: Store, app: App, partial: Partial) {
        super(socket, store, app);
        this._partial = partial;
    }

    async init() {
        super.init();
        this._submitted = false;
        this._inputWord = [];

        this._domElements.gameContainer.innerHTML = await FetchHTML("/views/slagalica.html");
        await I18nService.load("slagalica");
        I18nService.translate(this._domElements.gameContainer, "slagalica");

        this._localDom = {
            checkWord: document.querySelector("#checkWord")!,
            stopShufle: document.querySelector("#stopShufle")!,
            submitAnswer: document.querySelector("#submitAnswer")!,
            clearBtn: document.querySelector("#clearBtn")!,
            keyboard: document.querySelector("#keyboard")!,
            inputContainer: document.querySelector("#input")!,
            wordStatus: document.querySelector("#wordStatus")!,
        };

        const state = this._store.getState();
        console.log(state);

        this._gameData = {
            letters: state?.gameState.slagalica.letterComb ?? [],
            gameId: state?.gameId ?? "",
        };

        this._renderKeyboard();
        this._renderInputWord();
        this.initHeader();
        this._reciveResult();

        this.addEvents(this._localDom.clearBtn, "click", this._deleteLastLetter.bind(this));
        this.addEvents(this._localDom.checkWord, "click", this._checkWord.bind(this));
        this.addEvents(this._localDom.submitAnswer, "click", this._submit.bind(this));
        this.addEvents(this._localDom.stopShufle, "click", this._stopShuffle.bind(this));
        this.addEvents(document.body, "keydown", this._onKeyDown.bind(this) as EventListener);
        this.addEvents(document.body, "keyup", this._onKeyUp.bind(this) as EventListener);
        this.addEvents(document.body, "timeExpired", this._timeExpired.bind(this));

        this.addSocketEvents("wordCheckResult", this._onWordCheckResult.bind(this));
    }

    private _stopShuffle(): void {
        this._shuffleIntervals.forEach(clearInterval);
        this._shuffleIntervals = [];
        this._shuffling = false;

        const buttons = Array.from(
            this._localDom.keyboard.querySelectorAll<HTMLButtonElement>(".letter-btn")
        );
        buttons.forEach((btn, index) => {
            btn.textContent = this._gameData.letters[index];
            btn.disabled = false;
        });

        this._localDom.stopShufle.classList.add("hidden");
        this._localDom.checkWord.classList.remove("hidden");
        this._localDom.submitAnswer.classList.remove("hidden");
    }

    private _renderKeyboard(): void {
        this._localDom.keyboard.innerHTML = "";
        this._shuffleIntervals = [];
        this._shuffling = true;

        this._gameData.letters.forEach((letter, index) => {
            const btn = document.createElement("button");
            const id = `letter-${index}`;
            btn.id = id;
            btn.disabled = true;
            btn.textContent =
                this._gameData.letters[Math.floor(Math.random() * this._gameData.letters.length)];
            btn.className = [
                "letter-btn",
                "w-16 h-14 flex items-center justify-center",
                "bg-surface-raised border border-white/[0.06]",
                "hover:border-brand/60 hover:bg-surface-overlay",
                "rounded-lg text-content",
                "font-bold text-base transition-all active:scale-95 shadow-sm",
            ].join(" ");

            this.addEvents(btn, "click", this._onLetterClick.bind(this, letter, id));
            this._localDom.keyboard.appendChild(btn);

            const interval = setInterval(() => {
                btn.textContent =
                    this._gameData.letters[
                        Math.floor(Math.random() * this._gameData.letters.length)
                    ];
            }, 100);
            this._shuffleIntervals.push(interval);
        });
    }

    private _renderInputWord(): void {
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
                "shadow-brand-glow",
            ].join(" ");
            tile.textContent = letter;
            tilesRow.appendChild(tile);
        });
    }

    private _onLetterClick(letter: string, id: string): void {
        this._clearStatus();
        this._inputWord.push({ letter, id });
        document.getElementById(id)?.classList.add("invisible");
        this._renderInputWord();
    }

    private _onKeyDown(e: KeyboardEvent): void {
        if (this._shuffling || this._submitted) return;
        if (e.key === "Backspace") this._deleteLastLetter();
        if (e.key === "Enter") this._submit();
    }

    private _onKeyUp(e: KeyboardEvent): void {
        if (this._shuffling || this._submitted) return;
        const letter = KEY_MAP[e.keyCode];
        if (!letter || !this._gameData.letters.includes(letter)) return;

        const btn = Array.from(document.querySelectorAll<HTMLElement>(".letter-btn")).find(
            (el) => el.textContent === letter && !el.classList.contains("invisible")
        );

        if (btn) {
            this._clearStatus();
            this._inputWord.push({ letter, id: btn.id });
            btn.classList.add("invisible");
            this._renderInputWord();
        }
    }

    private _onWordCheckResult(data: { validated: boolean }): void {
        if (data.validated) {
            this._localDom.wordStatus.innerHTML = `<span class="text-positive">👍 Reč je prihvaćena</span>`;
        } else {
            this._localDom.wordStatus.innerHTML = `<span class="text-negative">❌ Reč nije prihvaćena</span>`;
        }
    }

    private _deleteLastLetter(): void {
        if (this._inputWord.length === 0) return;
        this._clearStatus();
        const last = this._inputWord.pop()!;
        document.getElementById(last.id)?.classList.remove("invisible");
        this._renderInputWord();
    }

    private _checkWord(): void {
        const word = this._getWord();
        if (!word) return;

        this._socket.emit(SOCKET_EVENTS.GAMES.SLAGALICA.CHECK, {
            gameId: this._gameData.gameId,
            word,
        });

        this._localDom.wordStatus.innerHTML = `<span class="inline-flex gap-1">
                <span class="w-1.5 h-1.5 bg-brand rounded-full animate-bounce"></span>
                <span class="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:150ms]"></span>
                <span class="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:300ms]"></span>
            </span>`;
    }

    private _submit(): void {
        if (this._submitted) return;

        this.clearTimer();
        this._submitted = true;
        this._socket.emit(SOCKET_EVENTS.GAMES.SLAGALICA.SUBMIT, {
            gameId: this._gameData.gameId,
            word: this._getWord(),
        });
    }

    private _getWord(): string {
        return this._inputWord.map((l) => l.letter).join("");
    }

    private _clearStatus(): void {
        this._localDom.wordStatus.innerHTML = "";
    }

    private _timeExpired(): void {
        console.log("times up");
        this._submitted = true;
        this._socket.emit(SOCKET_EVENTS.GAMES.SLAGALICA.SUBMIT, {
            gameId: this._gameData.gameId,
            word: "",
        });
    }

    private _reciveResult(): void {
        this._socket.on(SOCKET_EVENTS.GAMES.SLAGALICA.SUCCESS, (result) => {
            console.log(result);
            const word = this._store.getState()?.gameState.slagalica.word ?? "";
            this._partial.showModal({
                title: "Igra gotova!",
                text: `Osvojili ste ${result.data} poena`,
                solution: `Reč je: ${word}`,
                primaryText: "Zatvori",
                secondaryText: "Sledeće",
                secondaryAction: () =>
                    this._socket.emit(SOCKET_EVENTS.STATE.OPEN_GAME, {
                        gameId: this._gameData.gameId,
                        gameKey: GAME_KEYS.MOJ_BROJ,
                        playerId: this._socket.id,
                    }),
            });
        });
    }
}

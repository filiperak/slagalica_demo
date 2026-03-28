import { Socket } from "socket.io-client";
import Page from "../Page";
import { Store } from "../Store";
import { SOCKET_EVENTS, VIEWS } from "../util/ClientConstants";
import { Partial } from "../util/Partials";
import { FetchHTML } from "../util/Util";
import App from "../App";

const COL_LABELS = ["A", "B", "C", "D"];

interface Column {
    pojmovi: string[];
    rešenje: string;
}

interface GameData {
    columns: Column[];
    konačnoRešenje: string;
    gameId: string;
}

interface LocalDomElements {
    board: HTMLElement;
    finalInput: HTMLInputElement;
}

export class Asocijacije extends Page {
    private _localDom!: LocalDomElements;
    private _gameData!: GameData;
    private _partial: Partial;

    private _points: number = 0;
    private _submitted: boolean = false;
    private _columnSolved: boolean[] = [];
    private _columnCards: HTMLElement[][] = [];
    private _columnInputs: HTMLInputElement[] = [];

    constructor(socket: Socket, store: Store, app: App, partial: Partial) {
        super(socket, store, app);
        this._partial = partial;
    }

    async init() {
        super.init();
        this._points = 0;
        this._submitted = false;
        this._columnSolved = [false, false, false, false];
        this._columnCards = [];
        this._columnInputs = [];

        this._domElements.gameContainer.innerHTML = await FetchHTML("/views/asocijacije.html");

        this._localDom = {
            board: document.querySelector("#asociijaceBoard")!,
            finalInput: document.querySelector("#finalInput")!,
        };

        const state = this._store.getState__();
        const asocijacija = state?.gameState.asocijacije?.asocijacija;

        this._gameData = {
            columns: asocijacija?.columns ?? [],
            konačnoRešenje: asocijacija?.konačnoRešenje ?? "",
            gameId: state?.gameId ?? "",
        };

        this._buildBoard__();
        this.initHeader__();
        this._receiveResult__();

        this.addEvents__(this._localDom.finalInput, "keyup", this._onFinalInputKeyUp__.bind(this) as EventListener);
        this.addEvents__(document.body, "timeExpired", this._timeExpired__.bind(this));
    }

    private _buildBoard__(): void {
        this._gameData.columns.forEach((col, colIndex) => {
            const column = document.createElement("div");
            column.className = "flex flex-col gap-1.5";

            const cards: HTMLElement[] = [];
            col.pojmovi.forEach((clue, rowIndex) => {
                const card = document.createElement("div");
                card.textContent = `${COL_LABELS[colIndex]}${rowIndex + 1}`;
                card.className = [
                    "w-full py-3 px-1 text-center text-sm font-bold rounded-lg border cursor-pointer select-none",
                    "bg-surface-raised border-white/[0.06] text-content-muted",
                    "hover:bg-surface-overlay hover:border-brand/40 hover:text-white",
                    "transition-all",
                ].join(" ");

                this.addEvents__(card, "click", () => this._onCardClick__(card, colIndex, clue));
                cards.push(card);
                column.appendChild(card);
            });
            this._columnCards.push(cards);

            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = `Rešenje ${COL_LABELS[colIndex]}`;
            input.readOnly = true;
            input.setAttribute("autocomplete", "off");
            input.className = [
                "w-full px-2 py-2 rounded-lg border text-xs font-semibold text-center uppercase",
                "bg-surface border-white/[0.06] text-content placeholder:text-content-subtle",
                "focus:outline-none transition-all opacity-40",
            ].join(" ");

            this.addEvents__(input, "keyup", ((e: KeyboardEvent) => this._onColumnInputKeyUp__(e, colIndex)) as EventListener);
            this._columnInputs.push(input);
            column.appendChild(input);

            this._localDom.board.appendChild(column);
        });
    }

    private _onCardClick__(card: HTMLElement, colIndex: number, clue: string): void {
        if (card.dataset.revealed || this._submitted) return;

        card.textContent = clue;
        card.dataset.revealed = "1";
        card.classList.remove(
            "bg-surface-raised", "border-white/[0.06]", "text-content-muted",
            "hover:bg-surface-overlay", "hover:border-brand/40", "hover:text-white", "cursor-pointer"
        );
        card.classList.add("bg-brand/20", "border-brand/40", "text-white", "cursor-default");

        const input = this._columnInputs[colIndex];
        if (input.readOnly) {
            input.readOnly = false;
            input.classList.remove("opacity-40");
        }
    }

    private _onColumnInputKeyUp__(e: KeyboardEvent, colIndex: number): void {
        if (e.key !== "Enter") return;
        if (this._columnSolved[colIndex] || this._submitted) return;

        const input = this._columnInputs[colIndex];
        const value = input.value.trim().toUpperCase();

        if (value === this._gameData.columns[colIndex].rešenje) {
            this._columnSolved[colIndex] = true;
            this._points += 5;
            this._markColumnSolved__(colIndex);
            this._localDom.finalInput.readOnly = false;
            this._localDom.finalInput.classList.remove("opacity-40");
        } else {
            this._flashError__(input);
        }
    }

    private _onFinalInputKeyUp__(e: KeyboardEvent): void {
        if (e.key !== "Enter") return;
        if (this._submitted) return;

        const value = this._localDom.finalInput.value.trim().toUpperCase();
        if (value === this._gameData.konačnoRešenje) {
            this._points = 30;
            this._revealAll__();
            this._submit__();
        } else {
            this._flashError__(this._localDom.finalInput);
        }
    }

    private _markColumnSolved__(colIndex: number): void {
        const input = this._columnInputs[colIndex];
        input.readOnly = true;
        input.value = this._gameData.columns[colIndex].rešenje;
        input.classList.remove("border-white/[0.06]", "opacity-40");
        input.classList.add("border-positive", "bg-positive/10", "text-positive");

        this._columnCards[colIndex].forEach((card, i) => {
            setTimeout(() => {
                card.textContent = this._gameData.columns[colIndex].pojmovi[i];
                card.dataset.revealed = "1";
                card.classList.remove(
                    "bg-surface-raised", "bg-brand/20", "border-white/[0.06]", "border-brand/40",
                    "text-content-muted", "cursor-pointer",
                    "hover:bg-surface-overlay", "hover:border-brand/40", "hover:text-white"
                );
                card.classList.add("bg-positive/20", "border-positive", "text-white", "cursor-default");
            }, i * 60);
        });
    }

    private _revealAll__(): void {
        this._gameData.columns.forEach((_, i) => {
            if (!this._columnSolved[i]) this._markColumnSolved__(i);
        });
        const fi = this._localDom.finalInput;
        fi.readOnly = true;
        fi.classList.remove("border-white/[0.06]", "opacity-40");
        fi.classList.add("border-positive", "bg-positive/10", "text-positive");
    }

    private _flashError__(input: HTMLInputElement): void {
        input.classList.add("border-negative", "bg-negative/10");
        input.classList.remove("border-white/[0.06]");
        setTimeout(() => {
            input.classList.remove("border-negative", "bg-negative/10");
            input.classList.add("border-white/[0.06]");
            input.value = "";
        }, 500);
    }

    private _submit__(): void {
        if (this._submitted) return;
        this._submitted = true;
        this._clearTimer__();

        this._columnInputs.forEach((inp) => (inp.readOnly = true));
        this._localDom.finalInput.readOnly = true;

        this._socket.emit(SOCKET_EVENTS.GAMES.ASOCIJACIJE.SUBMIT, {
            gameId: this._gameData.gameId,
            points: this._points,
        });
    }

    private _timeExpired__(): void {
        this._submit__();
    }

    private _receiveResult__(): void {
        this.addSocketEvents__(SOCKET_EVENTS.GAMES.ASOCIJACIJE.SUCCESS, (result) => {
            this._partial.showModal__({
                title: "Igra gotova!",
                text: `Osvojili ste ${result.data} poena`,
                solution: `Konačno rešenje: ${this._gameData.konačnoRešenje}`,
                primaryText: "Zatvori",
                secondaryText: "Sledeće",
                secondaryAction: () => this._app.go(VIEWS.MENU),
            });
        });
    }
}

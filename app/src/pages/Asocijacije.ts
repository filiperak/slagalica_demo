import { Socket } from "socket.io-client";
import Page from "../Page";
import { Store } from "../Store";
import { SOCKET_EVENTS, VIEWS } from "../util/ClientConstants";
import { Partial } from "../util/Partials";
import { FetchHTML } from "../util/Util";
import { I18nService } from "../util/I18n";
import App from "../App";

const COL_LABELS = ["A", "B", "C", "D"];

interface Column {
    clues: string[];
    solution: string;
}

interface GameData {
    columns: Column[];
    finalSolution: string;
    gameId: string;
}

interface LocalDomElements {
    boardTop: HTMLElement;
    boardBottom: HTMLElement;
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
        await I18nService.load("asocijacije");
        I18nService.translate(this._domElements.gameContainer, "asocijacije");

        this._localDom = {
            boardTop: document.querySelector("#boardTop")!,
            boardBottom: document.querySelector("#boardBottom")!,
            finalInput: document.querySelector("#finalInput")!,
        };

        const state = this._store.getState();
        const asocijacija = state?.gameState.asocijacije?.asocijacija;

        this._gameData = {
            columns: asocijacija?.columns ?? [],
            finalSolution: asocijacija?.finalSolution ?? "",
            gameId: state?.gameId ?? "",
        };

        this._buildBoard();
        this.initHeader();
        this._receiveResult();

        this.addEvents(
            this._localDom.finalInput,
            "keyup",
            this._onFinalInputKeyUp.bind(this) as EventListener
        );
        this.addEvents(document.body, "timeExpired", this._timeExpired.bind(this));
    }

    private _buildBoard(): void {
        this._gameData.columns.forEach((col, colIndex) => {
            const column = document.createElement("div");
            column.className = "flex flex-col gap-1.5";

            const cards: HTMLElement[] = [];
            col.clues.forEach((clue, rowIndex) => {
                const card = document.createElement("div");
                card.textContent = `${COL_LABELS[colIndex]}${rowIndex + 1}`;
                card.className = [
                    "w-full py-3 px-1 text-center text-sm font-bold rounded-lg border cursor-pointer select-none",
                    "bg-surface-raised border-border-default text-content-muted",
                    "hover:bg-surface-overlay hover:border-border-strong",
                    "transition-all",
                ].join(" ");

                this.addEvents(card, "click", () => this._onCardClick(card, colIndex, clue));
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
                "bg-surface border-border-default text-content placeholder:text-content-subtle",
                "focus:outline-none transition-all opacity-40",
            ].join(" ");

            this.addEvents(input, "keyup", ((e: KeyboardEvent) =>
                this._onColumnInputKeyUp(e, colIndex)) as EventListener);
            this._columnInputs.push(input);

            if (colIndex < 2) {
                column.appendChild(input);
            } else {
                column.insertBefore(input, column.firstChild);
            }

            const target = colIndex < 2 ? this._localDom.boardTop : this._localDom.boardBottom;
            target.appendChild(column);
        });
    }

    private _onCardClick(card: HTMLElement, colIndex: number, clue: string): void {
        if (card.dataset.revealed || this._submitted) return;

        card.textContent = clue;
        card.dataset.revealed = "1";
        card.classList.remove(
            "bg-surface-raised",
            "border-border-default",
            "text-content-muted",
            "hover:bg-surface-overlay",
            "hover:border-border-strong",
            "cursor-pointer"
        );
        card.classList.add("bg-brand/20", "border-brand/40", "text-content", "cursor-default");

        const input = this._columnInputs[colIndex];
        if (input.readOnly) {
            input.readOnly = false;
            input.classList.remove("opacity-40");
        }
    }

    private _onColumnInputKeyUp(e: KeyboardEvent, colIndex: number): void {
        if (e.key !== "Enter") return;
        if (this._columnSolved[colIndex] || this._submitted) return;

        const input = this._columnInputs[colIndex];
        const value = input.value.trim().toUpperCase();

        if (value === this._gameData.columns[colIndex].solution) {
            this._columnSolved[colIndex] = true;
            this._points += 5;
            this._markColumnSolved(colIndex);
            this._localDom.finalInput.readOnly = false;
            this._localDom.finalInput.classList.remove("opacity-40");
        } else {
            this._flashError(input);
        }
    }

    private _onFinalInputKeyUp(e: KeyboardEvent): void {
        if (e.key !== "Enter") return;
        if (this._submitted) return;

        const value = this._localDom.finalInput.value.trim().toUpperCase();
        if (value === this._gameData.finalSolution) {
            this._points = 30;
            this._revealAll();
            this._submit();
        } else {
            this._flashError(this._localDom.finalInput);
        }
    }

    private _markColumnSolved(colIndex: number): void {
        const input = this._columnInputs[colIndex];
        input.readOnly = true;
        input.value = this._gameData.columns[colIndex].solution;
        input.classList.remove("border-border-default", "opacity-40");
        input.classList.add("border-positive", "bg-positive/10", "text-positive");

        this._columnCards[colIndex].forEach((card, i) => {
            setTimeout(() => {
                card.textContent = this._gameData.columns[colIndex].clues[i];
                card.dataset.revealed = "1";
                card.classList.remove(
                    "bg-surface-raised",
                    "bg-brand/20",
                    "border-border-default",
                    "border-brand/40",
                    "text-content-muted",
                    "text-content",
                    "cursor-pointer",
                    "hover:bg-surface-overlay",
                    "hover:border-border-strong"
                );
                card.classList.add(
                    "bg-positive/20",
                    "border-positive",
                    "text-content-on-brand",
                    "cursor-default"
                );
            }, i * 60);
        });
    }

    private _revealAll(): void {
        this._gameData.columns.forEach((_, i) => {
            if (!this._columnSolved[i]) this._markColumnSolved(i);
        });
        const fi = this._localDom.finalInput;
        fi.readOnly = true;
        fi.classList.remove("border-border-default", "opacity-40");
        fi.classList.add("border-positive", "bg-positive/10", "text-positive");
    }

    private _flashError(input: HTMLInputElement): void {
        input.classList.add("border-negative", "bg-negative/10");
        input.classList.remove("border-border-default");
        setTimeout(() => {
            input.classList.remove("border-negative", "bg-negative/10");
            input.classList.add("border-border-default");
            input.value = "";
        }, 500);
    }

    private _submit(): void {
        if (this._submitted) return;
        this._submitted = true;
        this.clearTimer();

        this._columnInputs.forEach((inp) => (inp.readOnly = true));
        this._localDom.finalInput.readOnly = true;

        this._socket.emit(SOCKET_EVENTS.GAMES.ASOCIJACIJE.SUBMIT, {
            gameId: this._gameData.gameId,
            points: this._points,
        });
    }

    private _timeExpired(): void {
        this._submit();
    }

    private _receiveResult(): void {
        this.addSocketEvents(SOCKET_EVENTS.GAMES.ASOCIJACIJE.SUCCESS, (result) => {
            const colSolutions = this._gameData.columns
                .map((col, i) => `${COL_LABELS[i]}: ${col.solution}`)
                .join(" | ");
            const finalLabel = I18nService.getMessage("asocijacije", "final_solution_label");
            this._partial.showModal({
                title: I18nService.getMessage("asocijacije", "game_over"),
                text: I18nService.getMessage("asocijacije", "result_score").replace(
                    "{n}",
                    String(result.data)
                ),
                solution: `${colSolutions} — ${finalLabel}: ${this._gameData.finalSolution}`,
                primaryText: I18nService.getMessage("asocijacije", "close"),
                secondaryText: I18nService.getMessage("asocijacije", "next"),
                secondaryAction: () => this._app.go(VIEWS.MENU),
            });
        });
    }
}

import { Socket } from "socket.io-client";
import Page from "../Page";
import { Store } from "../Store";
import { GAME_KEYS, SOCKET_EVENTS } from "../util/ClientConstants";
import { Partial } from "../util/Partials";
import { FetchHTML } from "../util/Util";
import { I18nService } from "../util/I18n";
import App from "../App";

const SYMBOL_IMGS = [
    "/assets/owl_logo.png",
    "/assets/tref.png",
    "/assets/caro.png",
    "/assets/spades.png",
    "/assets/herz.png",
    "/assets/star.png",
];

const ROWS = 6;
const COLS = 4;

interface LocalDomElements {
    board: HTMLElement;
    palette: HTMLElement;
}

interface GameData {
    gameId: string;
}

export class Skocko extends Page {
    private _localDom!: LocalDomElements;
    private _gameData!: GameData;
    private _partial: Partial;

    private _rowCounter: number = 0;
    private _currentComb: (number | null)[] = [];
    private _filledCount: number = 0;
    private _lastComb: number[] = [];
    private _submitted: boolean = false;

    private _boardSlots: HTMLElement[][] = [];
    private _scoreCircles: HTMLElement[][] = [];

    constructor(socket: Socket, store: Store, app: App, partial: Partial) {
        super(socket, store, app);
        this._partial = partial;
    }

    async init() {
        super.init();
        this._rowCounter = 0;
        this._currentComb = new Array(COLS).fill(null);
        this._filledCount = 0;
        this._lastComb = [];
        this._submitted = false;
        this._boardSlots = [];
        this._scoreCircles = [];

        this._domElements.gameContainer.innerHTML = await FetchHTML("/views/skocko.html");
        await I18nService.load("skocko");
        I18nService.translate(this._domElements.gameContainer, "skocko");

        this._localDom = {
            board: document.querySelector("#skockoBoard")!,
            palette: document.querySelector("#skockoPalette")!,
        };

        const state = this._store.getState();
        this._gameData = { gameId: state?.gameId ?? "" };

        this._buildBoard();
        this._buildPalette();
        this.initHeader();
        this._receiveCheckResult();
        this._receiveResult();

        this.addEvents(document.body, "timeExpired", this._timeExpired.bind(this));
    }

    private _buildBoard(): void {
        for (let i = 0; i < ROWS; i++) {
            const row = document.createElement("div");
            row.className = "flex items-center gap-2";

            const slots: HTMLElement[] = [];
            for (let j = 0; j < COLS; j++) {
                const slot = document.createElement("div");
                slot.className = [
                    "w-14 h-14 flex items-center justify-center",
                    "bg-surface-raised border border-border-default rounded-lg",
                    "transition-all cursor-pointer",
                ].join(" ");
                slots.push(slot);
                row.appendChild(slot);
                this.addEvents(slot, "click", () => this._onSlotClick(i, j));
            }
            this._boardSlots.push(slots);

            const scoreDisplay = document.createElement("div");
            scoreDisplay.className = "grid grid-cols-2 gap-1 ml-2";
            const circles: HTMLElement[] = [];
            for (let k = 0; k < COLS; k++) {
                const circle = document.createElement("div");
                circle.className = "w-3 h-3 rounded-full border border-border-default";
                circles.push(circle);
                scoreDisplay.appendChild(circle);
            }
            this._scoreCircles.push(circles);
            row.appendChild(scoreDisplay);

            this._localDom.board.appendChild(row);
        }
    }

    private _buildPalette(): void {
        SYMBOL_IMGS.forEach((src, index) => {
            const btn = document.createElement("button");
            btn.className = [
                "w-14 h-14 flex items-center justify-center p-1",
                "bg-surface-raised border border-border-default",
                "hover:border-border-strong hover:bg-surface-overlay",
                "rounded-lg transition-all active:scale-95",
            ].join(" ");

            const img = document.createElement("img");
            img.src = src;
            img.className = "w-full h-full object-contain pointer-events-none";
            btn.appendChild(img);

            this.addEvents(btn, "click", () => this._onSymbolClick(index));
            this._localDom.palette.appendChild(btn);
        });
    }

    private _onSymbolClick(symbolIndex: number): void {
        if (this._submitted || this._rowCounter >= ROWS) return;

        const emptySlot = this._currentComb.indexOf(null);
        if (emptySlot === -1) return;

        this._currentComb[emptySlot] = symbolIndex;
        this._renderSlot(this._rowCounter, emptySlot, symbolIndex);
        this._filledCount++;

        if (this._filledCount === COLS) {
            this._submitRow();
        }
    }

    private _onSlotClick(row: number, col: number): void {
        if (this._submitted || row !== this._rowCounter) return;
        if (this._currentComb[col] === null) return;

        this._currentComb[col] = null;
        this._filledCount--;
        this._clearSlot(row, col);
    }

    private _renderSlot(row: number, col: number, symbolIndex: number): void {
        const slot = this._boardSlots[row][col];
        slot.innerHTML = `<img src="${SYMBOL_IMGS[symbolIndex]}" class="w-10 h-10 object-contain pointer-events-none" />`;
        slot.classList.add("border-border-strong");
    }

    private _clearSlot(row: number, col: number): void {
        const slot = this._boardSlots[row][col];
        slot.innerHTML = "";
        slot.classList.remove("border-border-strong");
    }

    private _submitRow(): void {
        this._lastComb = this._currentComb as number[];

        this._socket.emit(SOCKET_EVENTS.GAMES.SKOCKO.CHECK, {
            gameId: this._gameData.gameId,
            cardComb: this._lastComb,
        });

        this._rowCounter++;
        this._currentComb = new Array(COLS).fill(null);
        this._filledCount = 0;

        if (this._rowCounter >= ROWS) {
            this._submit();
        }
    }

    private _receiveCheckResult(): void {
        this.addSocketEvents(
            SOCKET_EVENTS.GAMES.SKOCKO.RESULT,
            (data: { correctPositions: number; correctNumbers: number }) => {
                const targetRow = this._rowCounter - 1;
                if (targetRow < 0) return;

                const circles = this._scoreCircles[targetRow];
                let pos = data.correctPositions;
                let num = data.correctNumbers;

                circles.forEach((circle) => {
                    if (pos > 0) {
                        circle.className = "w-3 h-3 rounded-sm bg-red-500";
                        pos--;
                    } else if (num > 0) {
                        circle.className = "w-3 h-3 rounded-full border-2 border-yellow-400";
                        num--;
                    }
                });

                if (data.correctPositions === COLS) {
                    this._submit();
                }
            }
        );
    }

    private _submit(): void {
        if (this._submitted) return;
        this._submitted = true;
        this.clearTimer();

        this._socket.emit(SOCKET_EVENTS.GAMES.SKOCKO.SUBMIT, {
            gameId: this._gameData.gameId,
            cardComb: this._lastComb,
        });
    }

    private _timeExpired(): void {
        this._submit();
    }

    private _receiveResult(): void {
        this.addSocketEvents(SOCKET_EVENTS.GAMES.SKOCKO.SUCCESS, (result) => {
            const combination: number[] = this._store.getState()?.gameState.skocko ?? [];
            const solutionEl = this._buildSolutionElement(combination);
            this._partial.showModal({
                title: I18nService.getMessage("skocko", "game_over"),
                text: I18nService.getMessage("skocko", "result_score").replace(
                    "{n}",
                    String(result.data)
                ),
                solutionElement: solutionEl,
                primaryText: I18nService.getMessage("skocko", "close"),
                secondaryText: I18nService.getMessage("skocko", "next"),
                secondaryAction: () =>
                    this._socket.emit(SOCKET_EVENTS.STATE.OPEN_GAME, {
                        gameId: this._gameData.gameId,
                        gameKey: GAME_KEYS.KO_ZNA_ZNA,
                        playerId: this._socket.id,
                    }),
            });
        });
    }

    private _buildSolutionElement(combination: number[]): HTMLElement {
        const container = document.createElement("div");
        container.className = "flex items-center gap-2 flex-wrap justify-center";

        combination.forEach((symbolIndex) => {
            const img = document.createElement("img");
            img.src = SYMBOL_IMGS[symbolIndex];
            img.className = "w-8 h-8 object-contain";
            container.appendChild(img);
        });

        return container;
    }
}

import { Socket } from "socket.io-client";
import Page from "../Page";
import { Store } from "../Store";
import { GAME_KEYS, SOCKET_EVENTS } from "../util/ClientConstants";
import { Partial } from "../util/Partials";
import { FetchHTML } from "../util/Util";
import App from "../App";

const SYMBOL_IMGS = [
    "/assets/star.png",
    "/assets/herz.png",
    "/assets/tref.png",
    "/assets/caro.png",
    "/assets/spades.png",
    "/assets/owl_logo.png",
];

const SYMBOL_NAMES = ["zvezda", "herc", "tref", "karo", "pik", "sova"];

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

        this._localDom = {
            board: document.querySelector("#skockoBoard")!,
            palette: document.querySelector("#skockoPalette")!,
        };

        const state = this._store.getState__();
        this._gameData = { gameId: state?.gameId ?? "" };

        this._buildBoard__();
        this._buildPalette__();
        this.initHeader__();
        this._receiveCheckResult__();
        this._receiveResult__();

        this.addEvents__(document.body, "timeExpired", this._timeExpired__.bind(this));
    }

    private _buildBoard__(): void {
        for (let i = 0; i < ROWS; i++) {
            const row = document.createElement("div");
            row.className = "flex items-center gap-2";

            const slots: HTMLElement[] = [];
            for (let j = 0; j < COLS; j++) {
                const slot = document.createElement("div");
                slot.className = [
                    "w-14 h-14 flex items-center justify-center",
                    "bg-surface-raised border border-white/[0.06] rounded-lg",
                    "transition-all cursor-pointer",
                ].join(" ");
                slots.push(slot);
                row.appendChild(slot);
                this.addEvents__(slot, "click", () => this._onSlotClick__(i, j));
            }
            this._boardSlots.push(slots);

            const scoreDisplay = document.createElement("div");
            scoreDisplay.className = "grid grid-cols-2 gap-1 ml-2";
            const circles: HTMLElement[] = [];
            for (let k = 0; k < COLS; k++) {
                const circle = document.createElement("div");
                circle.className = "w-3 h-3 rounded-full bg-surface border border-white/[0.1]";
                circles.push(circle);
                scoreDisplay.appendChild(circle);
            }
            this._scoreCircles.push(circles);
            row.appendChild(scoreDisplay);

            this._localDom.board.appendChild(row);
        }
    }

    private _buildPalette__(): void {
        SYMBOL_IMGS.forEach((src, index) => {
            const btn = document.createElement("button");
            btn.className = [
                "w-14 h-14 flex items-center justify-center p-1",
                "bg-surface-raised border border-white/[0.06]",
                "hover:border-brand/60 hover:bg-surface-overlay",
                "rounded-lg transition-all active:scale-95",
            ].join(" ");

            const img = document.createElement("img");
            img.src = src;
            img.className = "w-full h-full object-contain pointer-events-none";
            btn.appendChild(img);

            this.addEvents__(btn, "click", () => this._onSymbolClick__(index));
            this._localDom.palette.appendChild(btn);
        });
    }

    // Places the symbol in the first empty slot of the current row
    private _onSymbolClick__(symbolIndex: number): void {
        if (this._submitted || this._rowCounter >= ROWS) return;

        const emptySlot = this._currentComb.indexOf(null);
        if (emptySlot === -1) return;

        this._currentComb[emptySlot] = symbolIndex;
        this._renderSlot__(this._rowCounter, emptySlot, symbolIndex);
        this._filledCount++;

        if (this._filledCount === COLS) {
            this._submitRow__();
        }
    }

    // Clicking a filled slot empties it; next symbol input fills the first empty slot
    private _onSlotClick__(row: number, col: number): void {
        if (this._submitted || row !== this._rowCounter) return;
        if (this._currentComb[col] === null) return;

        this._currentComb[col] = null;
        this._filledCount--;
        this._clearSlot__(row, col);
    }

    private _renderSlot__(row: number, col: number, symbolIndex: number): void {
        const slot = this._boardSlots[row][col];
        slot.innerHTML = `<img src="${SYMBOL_IMGS[symbolIndex]}" class="w-10 h-10 object-contain pointer-events-none" />`;
        slot.classList.add("border-brand/40");
    }

    private _clearSlot__(row: number, col: number): void {
        const slot = this._boardSlots[row][col];
        slot.innerHTML = "";
        slot.classList.remove("border-brand/40");
    }

    private _submitRow__(): void {
        this._lastComb = this._currentComb as number[];

        this._socket.emit(SOCKET_EVENTS.GAMES.SKOCKO.CHECK, {
            gameId: this._gameData.gameId,
            cardComb: this._lastComb,
        });

        this._rowCounter++;
        this._currentComb = new Array(COLS).fill(null);
        this._filledCount = 0;

        if (this._rowCounter >= ROWS) {
            this._submit__();
        }
    }

    private _receiveCheckResult__(): void {
        this.addSocketEvents__(SOCKET_EVENTS.GAMES.SKOCKO.RESULT, (data: { correctPositions: number; correctNumbers: number }) => {
            const targetRow = this._rowCounter - 1;
            if (targetRow < 0) return;

            const circles = this._scoreCircles[targetRow];
            let pos = data.correctPositions;
            let num = data.correctNumbers;

            circles.forEach((circle) => {
                if (pos > 0) {
                    circle.className = "w-3 h-3 rounded-full bg-positive";
                    pos--;
                } else if (num > 0) {
                    circle.className = "w-3 h-3 rounded-full bg-yellow-400";
                    num--;
                }
            });

            if (data.correctPositions === COLS) {
                this._submit__();
            }
        });
    }

    private _submit__(): void {
        if (this._submitted) return;
        this._submitted = true;
        this._clearTimer__();

        this._socket.emit(SOCKET_EVENTS.GAMES.SKOCKO.SUBMIT, {
            gameId: this._gameData.gameId,
            cardComb: this._lastComb,
        });
    }

    private _timeExpired__(): void {
        this._submit__();
    }

    private _receiveResult__(): void {
        this.addSocketEvents__(SOCKET_EVENTS.GAMES.SKOCKO.SUCCESS, (result) => {
            const combination: number[] = this._store.getState__()?.gameState.skocko ?? [];
            const combinationText = combination.map((i) => SYMBOL_NAMES[i]).join(" - ");
            this._partial.showModal__({
                title: "Igra gotova!",
                text: `Osvojili ste ${result.data} poena`,
                solution: `Kombinacija: ${combinationText}`,
                primaryText: "Zatvori",
                secondaryText: "Sledeće",
                secondaryAction: () => this._socket.emit(SOCKET_EVENTS.STATE.OPEN_GAME, {
                    gameId: this._gameData.gameId,
                    gameKey: GAME_KEYS.KO_ZNA_ZNA,
                    playerId: this._socket.id,
                }),
            });
        });
    }
}

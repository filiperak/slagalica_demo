import { Socket } from "socket.io-client";
import Page from "../Page";
import { Store } from "../Store";
import { GAME_KEYS, SOCKET_EVENTS } from "../util/ClientConstants";
import { Partial } from "../util/Partials";
import { FetchHTML } from "../util/Util";
import App from "../App";

interface LocalDomElements {
    targetNumber: HTMLElement;
    expressionDisplay: HTMLElement;
    firstRow: HTMLElement;
    secondRow: HTMLElement;
    operatorBtns: HTMLElement;
    deleteBtn: HTMLButtonElement;
    stopBtn: HTMLButtonElement;
    submitBtn: HTMLButtonElement;
}

interface GameData {
    numbers: number[];
    target: number;
    gameId: string;
}

const OPERATORS = ["+", "-", "*", "/", "(", ")"];

export class MojBroj extends Page {
    private _localDom!: LocalDomElements;
    private _gameData!: GameData;
    private _partial: Partial;

    private _combination: string[] = [];
    private _numberBtns: HTMLButtonElement[] = [];
    private _shuffleIntervals: ReturnType<typeof setInterval>[] = [];
    private _shuffling: boolean = true;
    private _submitted: boolean = false;

    constructor(socket: Socket, store: Store, app: App, partial: Partial) {
        super(socket, store, app);
        this._partial = partial;
    }

    async init() {
        super.init();
        this._submitted = false;
        this._shuffling = true;
        this._combination = [];
        this._numberBtns = [];
        this._shuffleIntervals = [];

        this._domElements.gameContainer.innerHTML = await FetchHTML("/views/mojBroj.html");

        this._localDom = {
            targetNumber: document.querySelector("#targetNumber")!,
            expressionDisplay: document.querySelector("#expressionDisplay")!,
            firstRow: document.querySelector("#firstRow")!,
            secondRow: document.querySelector("#secondRow")!,
            operatorBtns: document.querySelector("#operatorBtns")!,
            deleteBtn: document.querySelector("#deleteBtn")!,
            stopBtn: document.querySelector("#stopBtn")!,
            submitBtn: document.querySelector("#submitBtn")!,
        };

        const state = this._store.getState();
        const mojBrojState = state?.gameState.mojBroj;

        this._gameData = {
            numbers: mojBrojState?.numbers ?? [],
            target: mojBrojState?.target ?? 0,
            gameId: state?.gameId ?? "",
        };

        this._renderNumbers();
        this._renderOperators();
        this._startShuffle();
        this.initHeader();
        this._receiveResult();

        this.addEvents(this._localDom.deleteBtn, "click", this._deleteLast.bind(this));
        this.addEvents(this._localDom.stopBtn, "click", this._stopShuffle.bind(this));
        this.addEvents(this._localDom.submitBtn, "click", this._submit.bind(this));
        this.addEvents(document.body, "keydown", this._onKeyDown.bind(this) as EventListener);
        this.addEvents(document.body, "keypress", this._onKeyPress.bind(this) as EventListener);
        this.addEvents(document.body, "timeExpired", this._timeExpired.bind(this));
    }

    private _startShuffle(): void {
        const targetInterval = setInterval(() => {
            this._localDom.targetNumber.textContent = String(Math.floor(Math.random() * 900) + 99);
        }, 100);
        this._shuffleIntervals.push(targetInterval);
    }

    private _renderNumbers(): void {
        const firstRow = this._gameData.numbers.slice(0, 6);
        const secondRow = this._gameData.numbers.slice(6, 8);

        firstRow.forEach((num, index) => {
            const btn = this._createNumberBtn(num, index);
            const interval = setInterval(() => {
                btn.textContent = String(Math.floor(Math.random() * 8) + 1);
            }, 100);
            this._shuffleIntervals.push(interval);
            this._localDom.firstRow.appendChild(btn);
        });

        secondRow.forEach((num, index) => {
            const btn = this._createNumberBtn(num, 6 + index);
            const largeNums = [10, 15, 20, 25, 50];
            const interval = setInterval(() => {
                btn.textContent = String(largeNums[Math.floor(Math.random() * largeNums.length)]);
            }, 100);
            this._shuffleIntervals.push(interval);
            this._localDom.secondRow.appendChild(btn);
        });
    }

    private _createNumberBtn(value: number, index: number): HTMLButtonElement {
        const btn = document.createElement("button");
        btn.id = `num-btn-${index}`;
        btn.disabled = true;
        btn.textContent = String(value);
        btn.dataset.value = String(value);
        btn.className = [
            "num-btn",
            "w-14 h-12 flex items-center justify-center",
            "bg-surface-raised border border-white/[0.06]",
            "hover:border-brand/60 hover:bg-surface-overlay",
            "rounded-lg text-content",
            "font-bold text-base transition-all active:scale-95 shadow-sm",
        ].join(" ");

        this.addEvents(btn, "click", () => this._pushNumber(btn, value));
        this._numberBtns.push(btn);
        return btn;
    }

    private _renderOperators(): void {
        OPERATORS.forEach((op) => {
            const btn = document.createElement("button");
            btn.textContent = op;
            btn.className = [
                "w-12 h-12 flex items-center justify-center",
                "bg-surface-raised border border-white/[0.06]",
                "hover:border-brand/60 hover:bg-surface-overlay",
                "rounded-lg text-content-muted hover:text-white",
                "font-bold text-base transition-all active:scale-95",
            ].join(" ");

            this.addEvents(btn, "click", () => this._pushOperator(op));
            this._localDom.operatorBtns.appendChild(btn);
        });
    }

    private _stopShuffle(): void {
        this._shuffleIntervals.forEach(clearInterval);
        this._shuffleIntervals = [];
        this._shuffling = false;

        this._localDom.targetNumber.textContent = String(this._gameData.target);
        this._numberBtns.forEach((btn, index) => {
            btn.textContent = String(this._gameData.numbers[index]);
            btn.disabled = false;
        });

        this._localDom.stopBtn.classList.add("hidden");
        this._localDom.submitBtn.classList.remove("hidden");
    }

    private _pushNumber(btn: HTMLButtonElement, value: number): void {
        if (this._shuffling || this._submitted) return;

        const last = this._combination[this._combination.length - 1];
        if (!this._validateNext(last, String(value))) return;

        this._combination.push(String(value));
        btn.classList.add("invisible");
        this._renderExpression();
    }

    private _pushOperator(op: string): void {
        if (this._shuffling || this._submitted) return;

        const last = this._combination[this._combination.length - 1];
        if (!this._validateNext(last, op)) return;

        this._combination.push(op);
        this._renderExpression();
    }

    private _deleteLast(): void {
        if (this._combination.length === 0 || this._submitted) return;

        const last = this._combination.pop()!;

        if (!OPERATORS.includes(last)) {
            const num = Number(last);
            for (let i = this._numberBtns.length - 1; i >= 0; i--) {
                const btn = this._numberBtns[i];
                if (btn.classList.contains("invisible") && Number(btn.dataset.value) === num) {
                    btn.classList.remove("invisible");
                    break;
                }
            }
        }

        this._renderExpression();
    }

    private _renderExpression(): void {
        this._localDom.expressionDisplay.textContent = this._combination.join(" ");
    }

    private _validateNext(last: string | undefined, next: string): boolean {
        const isNumber = (s: string) => !OPERATORS.includes(s);

        if (last === undefined) {
            return isNumber(next) || next === "(";
        }
        if (isNumber(last) || last === ")") {
            return ["+", "-", "*", "/", ")"].includes(next);
        }
        // After binary operator or "("
        return isNumber(next) || next === "(";
    }

    private _submit(): void {
        if (this._submitted) return;
        this._submitted = true;
        this.clearTimer();

        this._socket.emit(SOCKET_EVENTS.GAMES.MOJ_BROJ.SUBMIT, {
            gameId: this._gameData.gameId,
            combination: this._combination.join(" "),
        });
    }

    private _onKeyDown(e: KeyboardEvent): void {
        if (e.key === " " && this._shuffling) {
            e.preventDefault();
            this._stopShuffle();
            return;
        }
        if (this._shuffling || this._submitted) return;
        if (e.key === "Backspace") this._deleteLast();
        if (e.key === "Enter") this._submit();
    }

    private _onKeyPress(e: KeyboardEvent): void {
        if (this._shuffling || this._submitted) return;
        if (["+", "-", "*", "/", "(", ")"].includes(e.key)) {
            this._pushOperator(e.key);
        }
    }

    private _timeExpired(): void {
        this._submitted = true;
        this._socket.emit(SOCKET_EVENTS.GAMES.MOJ_BROJ.SUBMIT, {
            gameId: this._gameData.gameId,
            combination: this._combination.join(" "),
        });
    }

    private _receiveResult(): void {
        this.addSocketEvents(SOCKET_EVENTS.GAMES.MOJ_BROJ.SUCCESS, (result) => {
            const solution = this._store.getState()?.gameState.mojBroj?.solution ?? "";
            this._partial.showModal({
                title: "Igra gotova!",
                text: `Osvojili ste ${result.data} poena`,
                solution: `Rešenje: ${solution}`,
                primaryText: "Zatvori",
                secondaryText: "Sledeće",
                secondaryAction: () =>
                    this._socket.emit(SOCKET_EVENTS.STATE.OPEN_GAME, {
                        gameId: this._gameData.gameId,
                        gameKey: GAME_KEYS.SPOJNICE,
                        playerId: this._socket.id,
                    }),
            });
        });
    }
}

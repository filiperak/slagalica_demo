import { Socket } from "socket.io-client";
import Page from "../Page";
import { Store } from "../Store";
import { GAME_KEYS, SOCKET_EVENTS } from "../util/ClientConstants";
import { Partial } from "../util/Partials";
import { FetchHTML } from "../util/Util";
import App from "../App";

interface SpojniceItem {
    id: number;
    name: string;
}

interface GameData {
    title: string;
    set: SpojniceItem[];
    gameId: string;
}

interface Card {
    el: HTMLElement;
    id: number;
    side: "left" | "right";
    matched: boolean;
}

interface LocalDomElements {
    title: HTMLElement;
    board: HTMLElement;
}

export class Spojnice extends Page {
    private _localDom!: LocalDomElements;
    private _gameData!: GameData;
    private _partial: Partial;

    private _cards: Card[] = [];
    private _phase: "pickLeft" | "pickRight" = "pickLeft";
    private _selectedLeft: Card | null = null;
    private _pick: number = 0;
    private _correctPick: number = 0;
    private _submitted: boolean = false;

    constructor(socket: Socket, store: Store, app: App, partial: Partial) {
        super(socket, store, app);
        this._partial = partial;
    }

    async init() {
        super.init();
        this._submitted = false;
        this._phase = "pickLeft";
        this._selectedLeft = null;
        this._pick = 0;
        this._correctPick = 0;
        this._cards = [];

        this._domElements.gameContainer.innerHTML = await FetchHTML("/views/spojnice.html");

        this._localDom = {
            title: document.querySelector("#spojniceTitle")!,
            board: document.querySelector("#spojniceBoard")!,
        };

        const state = this._store.getState__();
        const spojniceState = state?.gameState.spojnice;

        this._gameData = {
            title: spojniceState?.title ?? "",
            set: spojniceState?.set ?? [],
            gameId: state?.gameId ?? "",
        };

        this._localDom.title.textContent = this._gameData.title;
        this._buildBoard__();
        this.initHeader__();
        this._receiveResult__();

        this.addEvents__(this._localDom.board, "click", this._onBoardClick__.bind(this) as EventListener);
        this.addEvents__(document.body, "timeExpired", this._timeExpired__.bind(this));
    }

    private _buildBoard__(): void {
        const leftItems = this._gameData.set.filter((_, i) => i % 2 === 0);
        const rightItems = this._gameData.set.filter((_, i) => i % 2 !== 0);

        const leftCol = document.createElement("div");
        leftCol.className = "flex flex-col gap-2";
        const rightCol = document.createElement("div");
        rightCol.className = "flex flex-col gap-2";

        leftItems.forEach((item) => {
            const el = this._createCard__(item, "left");
            leftCol.appendChild(el);
        });

        rightItems.forEach((item) => {
            const el = this._createCard__(item, "right");
            rightCol.appendChild(el);
        });

        this._localDom.board.appendChild(leftCol);
        this._localDom.board.appendChild(rightCol);
    }

    private _createCard__(item: SpojniceItem, side: "left" | "right"): HTMLElement {
        const el = document.createElement("div");
        el.dataset.id = String(item.id);
        el.dataset.side = side;
        el.textContent = item.name;
        el.className = [
            "px-3 py-3 text-sm font-semibold text-center rounded-lg border cursor-pointer",
            "bg-surface-raised border-white/[0.06] text-content",
            "transition-all select-none",
            side === "right" ? "opacity-50" : "",
        ].join(" ");

        const card: Card = { el, id: item.id, side, matched: false };
        this._cards.push(card);
        return el;
    }

    private _onBoardClick__(e: MouseEvent): void {
        if (this._submitted) return;

        const target = (e.target as HTMLElement).closest("[data-side]") as HTMLElement | null;
        if (!target) return;

        const card = this._cards.find((c) => c.el === target);
        if (!card || card.matched) return;

        if (card.side === "left") {
            this._selectLeft__(card);
        } else if (this._phase === "pickRight" && card.side === "right") {
            this._resolvePair__(card);
        }
    }

    private _selectLeft__(card: Card): void {
        if (this._selectedLeft === card) {
            // Deselect
            card.el.classList.remove("border-brand", "bg-surface-overlay");
            card.el.classList.add("border-white/[0.06]");
            this._selectedLeft = null;
            this._setRightOpacity__(true);
            return;
        }

        if (this._selectedLeft) {
            this._selectedLeft.el.classList.remove("border-brand", "bg-surface-overlay");
            this._selectedLeft.el.classList.add("border-white/[0.06]");
        }

        card.el.classList.add("border-brand", "bg-surface-overlay");
        card.el.classList.remove("border-white/[0.06]");
        this._selectedLeft = card;
        this._phase = "pickRight";
        this._setRightOpacity__(false);
    }

    private _resolvePair__(rightCard: Card): void {
        const leftCard = this._selectedLeft!;
        const correct = leftCard.id === rightCard.id;

        this._markCard__(leftCard, correct);
        this._markCard__(rightCard, correct);

        if (correct) this._correctPick++;
        this._pick++;

        this._selectedLeft = null;
        this._phase = "pickLeft";
        this._setRightOpacity__(true);

        if (this._pick === 8) this._submit__();
    }

    private _markCard__(card: Card, correct: boolean): void {
        card.matched = true;
        card.el.classList.remove(
            "border-white/[0.06]", "border-brand",
            "bg-surface-raised", "bg-surface-overlay",
            "opacity-50", "cursor-pointer"
        );
        card.el.classList.add(
            correct ? "bg-positive" : "bg-negative/20",
            correct ? "border-positive" : "border-negative",
            "cursor-default"
        );
    }

    private _setRightOpacity__(dim: boolean): void {
        this._cards
            .filter((c) => c.side === "right" && !c.matched)
            .forEach((c) => c.el.classList.toggle("opacity-50", dim));
    }

    private _submit__(): void {
        if (this._submitted) return;
        this._submitted = true;
        this._clearTimer__();

        this._socket.emit(SOCKET_EVENTS.GAMES.SPOJNICE.SUBMIT, {
            gameId: this._gameData.gameId,
            correctPick: this._correctPick,
        });
    }

    private _timeExpired__(): void {
        this._submit__();
    }

    private _receiveResult__(): void {
        this.addSocketEvents__(SOCKET_EVENTS.GAMES.SPOJNICE.SUCCESS, (result) => {
            this._partial.showModal__({
                title: "Igra gotova!",
                text: `Osvojili ste ${result.data} poena`,
                solution: `Tačnih parova: ${this._correctPick} / 8`,
                primaryText: "Zatvori",
                secondaryText: "Sledeće",
                secondaryAction: () => this._socket.emit(SOCKET_EVENTS.STATE.OPEN_GAME, {
                    gameId: this._gameData.gameId,
                    gameKey: GAME_KEYS.SKOCKO,
                    playerId: this._socket.id,
                }),
            });
        });
    }
}

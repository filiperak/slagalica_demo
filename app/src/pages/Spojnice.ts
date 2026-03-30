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

        const state = this._store.getState();
        const spojniceState = state?.gameState.spojnice;

        this._gameData = {
            title: spojniceState?.title ?? "",
            set: spojniceState?.set ?? [],
            gameId: state?.gameId ?? "",
        };

        this._localDom.title.textContent = this._gameData.title;
        this._buildBoard();
        this.initHeader();
        this._receiveResult();

        this.addEvents(
            this._localDom.board,
            "click",
            this._onBoardClick.bind(this) as EventListener
        );
        this.addEvents(document.body, "timeExpired", this._timeExpired.bind(this));
    }

    private _buildBoard(): void {
        const leftItems = this._gameData.set.filter((_, i) => i % 2 === 0);
        const rightItems = this._gameData.set.filter((_, i) => i % 2 !== 0);

        const leftCol = document.createElement("div");
        leftCol.className = "flex flex-col gap-2";
        const rightCol = document.createElement("div");
        rightCol.className = "flex flex-col gap-2";

        leftItems.forEach((item) => {
            const el = this._createCard(item, "left");
            leftCol.appendChild(el);
        });

        rightItems.forEach((item) => {
            const el = this._createCard(item, "right");
            rightCol.appendChild(el);
        });

        this._localDom.board.appendChild(leftCol);
        this._localDom.board.appendChild(rightCol);
    }

    private _createCard(item: SpojniceItem, side: "left" | "right"): HTMLElement {
        const el = document.createElement("div");
        el.dataset.id = String(item.id);
        el.dataset.side = side;
        el.textContent = item.name;
        el.className = [
            "px-3 py-3 text-sm font-semibold text-center rounded-lg border cursor-pointer",
            "bg-surface-raised border-border-default text-content",
            "transition-all select-none",
            side === "right" ? "opacity-50" : "",
        ].join(" ");

        const card: Card = { el, id: item.id, side, matched: false };
        this._cards.push(card);
        return el;
    }

    private _onBoardClick(e: MouseEvent): void {
        if (this._submitted) return;

        const target = (e.target as HTMLElement).closest("[data-side]") as HTMLElement | null;
        if (!target) return;

        const card = this._cards.find((c) => c.el === target);
        if (!card || card.matched) return;

        if (card.side === "left") {
            this._selectLeft(card);
        } else if (this._phase === "pickRight" && card.side === "right") {
            this._resolvePair(card);
        }
    }

    private _selectLeft(card: Card): void {
        if (this._selectedLeft === card) {
            // Deselect
            card.el.classList.remove("border-brand", "bg-surface-overlay");
            card.el.classList.add("border-border-default");
            this._selectedLeft = null;
            this._setRightOpacity(true);
            return;
        }

        if (this._selectedLeft) {
            this._selectedLeft.el.classList.remove("border-brand", "bg-surface-overlay");
            this._selectedLeft.el.classList.add("border-border-default");
        }

        card.el.classList.add("border-brand", "bg-surface-overlay");
        card.el.classList.remove("border-border-default");
        this._selectedLeft = card;
        this._phase = "pickRight";
        this._setRightOpacity(false);
    }

    private _resolvePair(rightCard: Card): void {
        const leftCard = this._selectedLeft!;
        const correct = leftCard.id === rightCard.id;

        this._markCard(leftCard, correct);
        this._markCard(rightCard, correct);

        if (correct) this._correctPick++;
        this._pick++;

        this._selectedLeft = null;
        this._phase = "pickLeft";
        this._setRightOpacity(true);

        if (this._pick === 8) this._submit();
    }

    private _markCard(card: Card, correct: boolean): void {
        card.matched = true;
        card.el.classList.remove(
            "border-border-default",
            "border-brand",
            "bg-surface-raised",
            "bg-surface-overlay",
            "opacity-50",
            "cursor-pointer",
            "text-content"
        );
        card.el.classList.add(
            correct ? "bg-positive" : "bg-negative/20",
            correct ? "border-positive" : "border-negative",
            correct ? "text-content-on-brand" : "text-content",
            "cursor-default"
        );
    }

    private _setRightOpacity(dim: boolean): void {
        this._cards
            .filter((c) => c.side === "right" && !c.matched)
            .forEach((c) => c.el.classList.toggle("opacity-50", dim));
    }

    private _submit(): void {
        if (this._submitted) return;
        this._submitted = true;
        this.clearTimer();

        this._socket.emit(SOCKET_EVENTS.GAMES.SPOJNICE.SUBMIT, {
            gameId: this._gameData.gameId,
            correctPick: this._correctPick,
        });
    }

    private _timeExpired(): void {
        this._submit();
    }

    private _receiveResult(): void {
        this.addSocketEvents(SOCKET_EVENTS.GAMES.SPOJNICE.SUCCESS, (result) => {
            this._partial.showModal({
                title: "Igra gotova!",
                text: `Osvojili ste ${result.data} poena`,
                solution: `Tačnih parova: ${this._correctPick} / 8`,
                primaryText: "Zatvori",
                secondaryText: "Sledeće",
                secondaryAction: () =>
                    this._socket.emit(SOCKET_EVENTS.STATE.OPEN_GAME, {
                        gameId: this._gameData.gameId,
                        gameKey: GAME_KEYS.SKOCKO,
                        playerId: this._socket.id,
                    }),
            });
        });
    }
}

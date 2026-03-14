import { Socket } from "socket.io-client";
import Page from "../Page";
import { FetchHTML } from "../util/Util";
import { Store, GameState } from "../Store";
import { SOCKET_EVENTS, VIEWS } from "../util/ClientConstants";
import { Partial } from "../util/Partials";
import App from "../App";

interface LocalDomElements {
    leaveBtn: HTMLElement;
    slagalicaBtn: HTMLElement;
    mojBrojBtn: HTMLElement;
    spojniceBtn: HTMLElement;
    skockoBtn: HTMLElement;
    koZnaZnaBtn: HTMLElement;
    asocijacijeBtn: HTMLElement;
    p0Name: HTMLElement;
    p0Total: HTMLElement;
    p0Slagalica: HTMLElement;
    p0MojBroj: HTMLElement;
    p0Spojnice: HTMLElement;
    p0Skocko: HTMLElement;
    p0KoZnaZna: HTMLElement;
    p0Asocijacije: HTMLElement;
    p1Name: HTMLElement;
    p1Total: HTMLElement;
    p1Slagalica: HTMLElement;
    p1MojBroj: HTMLElement;
    p1Spojnice: HTMLElement;
    p1Skocko: HTMLElement;
    p1KoZnaZna: HTMLElement;
    p1Asocijacije: HTMLElement;
}

export class Menu extends Page {
    private _unsub: (() => void) | null = null;
    private _localDom!: LocalDomElements;
    private _partial: Partial;

    constructor(socket: Socket, store: Store, app:App, partial: Partial) {
        super(socket, store, app);
        this._partial = partial;
    }

    async init() {
        super.init();
        
        const menuHTML = await FetchHTML("/views/menu.html");
        this._domElements.gameContainer.innerHTML = menuHTML;

        // Initialize local DOM references
        this._localDom = {
            leaveBtn: document.querySelector("#leave-game-btn")!,
            slagalicaBtn: document.querySelector("#slagalica")!,
            mojBrojBtn: document.querySelector("#mojBroj")!,
            spojniceBtn: document.querySelector("#spojnice")!,
            skockoBtn: document.querySelector("#skocko")!,
            koZnaZnaBtn: document.querySelector("#koZnaZna")!,
            asocijacijeBtn: document.querySelector("#asocijacije")!,

            p0Name: document.querySelector("#p0-name")!,
            p0Total: document.querySelector("#p0-total")!,
            p0Slagalica: document.querySelector("#p0-slagalica")!,
            p0MojBroj: document.querySelector("#p0-mojBroj")!,
            p0Spojnice: document.querySelector("#p0-spojnice")!,
            p0Skocko: document.querySelector("#p0-skocko")!,
            p0KoZnaZna: document.querySelector("#p0-koZnaZna")!,
            p0Asocijacije: document.querySelector("#p0-asocijacije")!,

            p1Name: document.querySelector("#p1-name")!,
            p1Total: document.querySelector("#p1-total")!,
            p1Slagalica: document.querySelector("#p1-slagalica")!,
            p1MojBroj: document.querySelector("#p1-mojBroj")!,
            p1Spojnice: document.querySelector("#p1-spojnice")!,
            p1Skocko: document.querySelector("#p1-skocko")!,
            p1KoZnaZna: document.querySelector("#p1-koZnaZna")!,
            p1Asocijacije: document.querySelector("#p1-asocijacije")!,
        };

        // Subscription for state changes
        this._unsub = this._store.subscribe((state: GameState) => {
            this.render__(state);
        });

        // Initial render
        const initialState = this._store.getState__();
        if (initialState) this.render__(initialState);

        // Events
        this.addEvents__(this._localDom.leaveBtn, "click", this._leaveGame__.bind(this));
        
        const games = ["slagalica", "mojBroj", "spojnice", "skocko", "koZnaZna", "asocijacije"];
        games.forEach((game) => {
            const btn = this._localDom[`${game}Btn` as keyof LocalDomElements] as HTMLElement;
            if (btn) {
                this.addEvents__(btn, "click", this._openGame__.bind(this, game));
            }
        });
    }

    render__(state: GameState) {
        if (!state || !state.players) return;
        console.log("Rendering Menu with state:", state);

        const games = ["slagalica", "mojBroj", "spojnice", "skocko", "koZnaZna", "asocijacije"];

        // 1. Logic to disable buttons if game is already 'opend' for the local player
        const localPlayer = state.players.find(p => p.id === this._socket.id);

        if (localPlayer) {
            games.forEach((gameKey) => {
                const btn = this._localDom[`${gameKey}Btn` as keyof LocalDomElements] as HTMLButtonElement;
                if (btn) {
                    const gameInfo = localPlayer.score.games[gameKey as keyof typeof localPlayer.score.games];
                    const isOpened = gameInfo?.opend ?? false;

                    if (isOpened) {
                        btn.disabled = true;
                        btn.classList.add("opacity-50", "cursor-not-allowed", "grayscale");
                        // We remove hover effects to ensure it looks truly inactive
                        btn.classList.remove("hover:bg-blue-600", "hover:scale-105"); 
                    } else {
                        btn.disabled = false;
                        btn.classList.remove("opacity-50", "cursor-not-allowed", "grayscale");
                    }
                }
            });
        }

        // 2. Logic to update the scoreboard table
        state.players.forEach((player, index) => {
            const prefix = `p${index}`;

            // Update Name
            const nameEl = this._localDom[`${prefix}Name` as keyof LocalDomElements];
            if (nameEl) nameEl.textContent = player.name || `Igrač ${index + 1}`;

            // Update Total
            const totalEl = this._localDom[`${prefix}Total` as keyof LocalDomElements];
            if (totalEl) totalEl.textContent = player.score.total.toString();

            // Update Individual Game Scores in Table
            games.forEach((gameKey) => {
                const domKey = `${prefix}${gameKey.charAt(0).toUpperCase() + gameKey.slice(1)}` as keyof LocalDomElements;
                const scoreEl = this._localDom[domKey] as HTMLElement;

                if (scoreEl) {
                    const gameData = player.score.games[gameKey as keyof typeof player.score.games];
                    scoreEl.textContent = (gameData?.score ?? 0).toString();
                }
            });
        });
    }

    dispose__() {
        super.dispose__();
        if (this._unsub) {
            this._unsub();
            this._unsub = null;
        }
    }

    _leaveGame__() {
        // Using the inherited _partial from Page class for a cleaner exit
        this._partial.showModal__({
            title: "Napuštanje",
            text: "Da li ste sigurni da želite da napustite partiju?",
            primaryText: "Da",
            secondaryText: "Ne",
            primaryAction: () => {
                this._socket.emit(SOCKET_EVENTS.CORE.LEAVE_GAME);
                this._app.go(VIEWS.LOBY);
            },
            secondaryAction: () => {}
        });
    }

    _openGame__(gameKey: string) {
        const state = this._store.getState__();
        console.log(state);
        
        const localPlayer = state?.players.find(p => p.id === this._socket.id);
        
        // Final guard: don't emit if already opened
        const alreadyOpened = localPlayer?.score.games[gameKey as keyof typeof localPlayer.score.games]?.opend;
        if (alreadyOpened) return;

        console.log(`Menu requested game: ${gameKey}`);
        this._socket.emit(SOCKET_EVENTS.STATE.OPEN_GAME, {
            gameId: state?.gameId,
            gameKey,
            playerId: this._socket.id,
        });
    }
}
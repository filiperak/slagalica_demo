import { Socket } from "socket.io";
import Page from "../Page.js";
import { FetchHTML } from "../util/FetchHTML.js";
import { Store, GameState } from "../Store.js";
import { SOCKET_EVENTS } from "../util/ClientConstants.js";
import { RouerFn } from "../util/Types.js";
import { Partial } from "../util/Partials.js";

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

    constructor(socket: Socket, store: Store, router: RouerFn, partial: Partial) {
        super(socket, store, router, partial);
    }

    async init() {
        const menuHTML = await FetchHTML("../views/menu.html");
        this._domElements.gameContainer.innerHTML = menuHTML;

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

        const initialState = this._store.getState__();
        if (initialState) this.render__(initialState);

        this._unsub = this._store.subscribe((state: GameState) => {
            this.render__(state);
        });

        this.addEvents__(this._localDom.leaveBtn, "click", this._leaveGame__.bind(this));
        
        const games = ["slagalica", "mojBroj", "spojnice", "skocko", "koZnaZna", "asocijacije"];
        games.forEach((game) => {
            const btn = this._localDom[`${game}Btn` as keyof LocalDomElements] as HTMLElement;
            this.addEvents__(btn, "click", this._openGame__.bind(this, game));
        });
    }

    render__(state: GameState) {
        if (!state || !state.players) return;

        const games = ["slagalica", "mojBroj", "spojnice", "skocko", "koZnaZna", "asocijacije"];

        state.players.forEach((player, index) => {
            const prefix = `p${index}`;

            (this._localDom[`${prefix}Name` as keyof LocalDomElements] as HTMLElement).textContent =
                player.name || `Igrač ${index + 1}`;

            (
                this._localDom[`${prefix}Total` as keyof LocalDomElements] as HTMLElement
            ).textContent = player.score.total.toString();

            games.forEach((gameKey) => {
                const domKey =
                    `${prefix}${gameKey.charAt(0).toUpperCase() + gameKey.slice(1)}` as keyof LocalDomElements;
                const element = this._localDom[domKey] as HTMLElement;

                if (element) {
                    const gameData = player.score.games[gameKey as keyof typeof player.score.games];
                    element.textContent = (gameData?.score ?? 0).toString();
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
        this._socket.emit(SOCKET_EVENTS.CORE.LEAVE_GAME);
        alert("you left");
    }

    _openGame__(gameKey: string) {
        console.log(`menu reqested game:${gameKey}`);

        this._socket.emit(SOCKET_EVENTS.STATE.OPEN_GAME, {
            gameId: this._store.getState__()?.gameId,
            gameKey,
            playerId: this._socket.id,
        });
    }
}

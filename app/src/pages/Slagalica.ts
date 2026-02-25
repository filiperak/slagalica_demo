import { Socket } from "socket.io";
import Page from "../Page.js";
import { Store, GameState } from "../Store.js";
import { RouerFn } from "../util/Types.js";
import { SOCKET_EVENTS, VIEWS } from "../util/ClientConstants.js";
import { Partial } from "../util/Partials.js";

export class Slagalica extends Page {

    constructor(socket: Socket, store: Store, router: RouerFn, partial:Partial) {
        super(socket, store, router, partial);
    }

    init() {
        super.init();
        this._domElements.gameContainer.innerHTML = "<h1>Slagalica</h1>";
        this.initHeader__({
            durationSeconds: 90,
            timeoutMessage: "Vreme za Slagalicu je isteklo!",
            backMessage: "Da li ste sigurni da želite da napustite Slagalicu?",
        });
    }

    protected onHeaderExit__(message: string): void {
        // this._socket.emit(SOCKET_EVENTS.STATE.GAME_TIMEOUT, { ILI VEC NESTO SLICNO
        //     gameId: this._store.getState__()?.gameId,
        // });
        super.onHeaderExit__(message);
    }
}
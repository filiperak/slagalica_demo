import { Socket } from "socket.io-client";
import Page from "../Page";
import { Store, GameState } from "../Store";
import { RouerFn } from "../util/Types";

export class MojBroj extends Page {

    constructor(socket: Socket, store: Store, router: RouerFn) {
        super(socket, store, router);
    }

    init() {
        this._domElements.gameContainer.innerHTML = "<h1>MOjborj</h1>";
    }
}

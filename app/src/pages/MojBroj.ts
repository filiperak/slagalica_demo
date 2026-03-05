import { Socket } from "socket.io-client";
import Page from "../Page";
import { Store, GameState } from "../Store";
import { RouerFn } from "../util/Types";
import { Partial } from "../util/Partials";

export class MojBroj extends Page {

    constructor(socket: Socket, store: Store, router: RouerFn, partal: Partial) {
        super(socket,store, router, partal);
    }

    init() {
        this._domElements.gameContainer.innerHTML = "<h1>MOjborj</h1>";
    }
}

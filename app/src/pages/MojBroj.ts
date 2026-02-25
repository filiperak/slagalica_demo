import { Socket } from "socket.io";
import Page from "../Page.js";
import { Store, GameState } from "../Store.js";
import { RouerFn } from "../util/Types.js";
import { Partial } from "../util/Partials.js";

export class MojBroj extends Page {

    constructor(socket: Socket, store: Store, router: RouerFn, partal: Partial) {
        super(socket,store, router, partal);
    }

    init() {
        this._domElements.gameContainer.innerHTML = "<h1>MOjborj</h1>";
    }
}

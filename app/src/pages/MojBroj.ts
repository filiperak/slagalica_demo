import { Socket } from "socket.io";
import Page from "../Page.js";
import { Store, GameState } from "../Store.js";
import { RouerFn } from "../util/Types.js";

export class MojBroj extends Page {
    private _socket: Socket;

    constructor(socket: Socket, store: Store, router: RouerFn) {
        super(store, router);
        this._socket = socket;
    }

    init() {
        this._domElements.gameContainer.innerHTML = "<h1>MOjborj</h1>";
    }
}

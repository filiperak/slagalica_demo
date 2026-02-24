import { Socket } from "socket.io";
import Page from "../Page.js";
import { Store, GameState } from "../Store.js";

export class MojBroj extends Page {
    private _socket: Socket;

    constructor(socket: Socket, store: Store) {
        super(store);
        this._socket = socket;
    }

    init() {
        this._domElements.gameContainer.innerHTML = "<h1>MOjborj</h1>";
    }
}

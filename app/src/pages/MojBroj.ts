import { Socket } from "socket.io-client";
import Page from "../Page";
import { Store, GameState } from "../Store";
import App from "../App";

export class MojBroj extends Page {

    constructor(socket: Socket, store: Store, app: App) {
        super(socket, store, app);
    }

    init() {
        this._domElements.gameContainer.innerHTML = "<h1>MOjborj</h1>";
    }
}

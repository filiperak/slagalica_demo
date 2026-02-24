import { Socket } from "socket.io";
import Page from "../Page.js";
import { Store, GameState } from "../Store.js";

export class Slagalica extends Page {
    private _socket: Socket;

    constructor(socket: Socket, store: Store) {
        super(store);
        this._socket = socket;
    }

    init() {
        super.init();
        this._domElements.gameContainer.innerHTML = "<h1>Slagalica</h1>";
        this.initHeader__({
            durationSeconds: 90,
            alertMessage: "Vreme za Slagalicu je isteklo!",
            onTimeout: () => {
                // nesto ovde
            },
        });
    }
}

import { Socket } from "socket.io";
import Page from "../Page.js";
import { FetchHTML } from "../util/FetchHTML.js";


export class Menu extends Page {
    private _socket: Socket;


    constructor(socket:Socket) {
        super();
        this._socket = socket;
    }

    async init() {
        console.log("Menu page initialized");
        const menuHTML = await FetchHTML("../views/menu.html");
        this._domElements.gameContainer.innerHTML = menuHTML;
    }
}
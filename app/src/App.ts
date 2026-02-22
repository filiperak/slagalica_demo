import Loby from "./pages/Loby.js";
import { Socket } from "socket.io";
import { Menu } from "./pages/Menu.js";
import { SOCKET_EVENTS, VIEWS } from "./util/ClientConstants.js";
import Page from "./Page.js";
import { Partial } from "./util/Partials.js";
import { Store } from "./Store.js";

declare const io: any;

interface Views {
    loby: Loby;
    menu: Menu;
}

export default class App {
    private _ioUrl: string;
    private _socket: Socket;
    private _previousView: Page | null;
    private _views: Views;
    private _partial: Partial;
    private _store: Store;

    constructor(ioUrl: string) {
        this._ioUrl = ioUrl;
        this._socket = io(ioUrl);
        this._previousView = null;
        this._partial = new Partial();
        this._store = new Store();

        this._views = {
            loby: new Loby(this._socket, this._partial, this._store),
            menu: new Menu(this._socket, this._store),
        };
        this._addSocketEvents__();
    }

    init() {
        this._router(VIEWS.LOBY);
        console.log(this._socket);
    }

    _router(page: keyof Views) {
        if (this._previousView) {
            this._previousView._dispose();
        }
        this._views[page].init();
        this._previousView = this._views[page];
    }

    _addSocketEvents__() {
        this._socket.on(SOCKET_EVENTS.STATE.START_GAME, ({ game }) => {
            console.log(game);
            this._store.setState__(game);

            this._partial.hideModal__();
            this._router(VIEWS.MENU);
        });
    }
}

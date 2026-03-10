import { io, Socket } from "socket.io-client";
import { ThemeService } from "./util/ThemeService";
import Loby from "./pages/Loby";
import { Menu } from "./pages/Menu";
import { SOCKET_EVENTS, VIEWS } from "./util/ClientConstants";
import Page from "./Page";
import { Partial } from "./util/Partials";
import { Store } from "./Store";
import { Slagalica } from "./pages/Slagalica";
import { MojBroj } from "./pages/MojBroj";

interface Views {
    loby: Loby;
    menu: Menu;
    slagalica: Slagalica;
    mojBroj: MojBroj;
}

export default class App {
    private _socket: Socket;
    private _previousView: Page | null;
    private _views: Views;
    private _partial: Partial;
    private _store: Store;

    constructor() {
        ThemeService.apply(ThemeService.get());
        this._socket = io();
        this._previousView = null;
        this._partial = new Partial();
        this._store = new Store();

        this._views = {
            loby: new Loby(this._socket, this._partial, this._store, this.go.bind(this)),
            menu: new Menu(this._socket, this._store, this.go.bind(this), this._partial),
            slagalica: new Slagalica(this._socket, this._store, this.go.bind(this), this._partial),
            mojBroj: new MojBroj(this._socket, this._store, this.go.bind(this), this._partial),
        };

        this._addSocketEvents__();
    }

    init() {
        this.go(VIEWS.LOBY);
        console.log(this._socket);
    }

    go(page: keyof Views) {
        if (this._previousView) {
            this._previousView.dispose__();
        }

        this._views[page].init();
        this._previousView = this._views[page];
    }

    //IMPLEMENT NEXT(PAGE) AND CREATE nAVIGATORO CLASS

    _addSocketEvents__() {
        this._socket.on(SOCKET_EVENTS.STATE.START_GAME, ({ game }) => {
            this._store.setState__(game);
            this._partial.hideModal__();
            this.go(VIEWS.MENU);
        });

        this._socket.on(SOCKET_EVENTS.STATE.GAME_DATA, ({ gameKey, gameState }) => {
            console.log("Received game data:", gameKey, gameState);
            this.go(gameKey as keyof Views);
        });

        this._socket.on(SOCKET_EVENTS.STATE.PLAYERS_STATE, (state) => {
            this._store.setState__(state);
            console.log(state);
        });

        this._socket.on(SOCKET_EVENTS.CORE.OPPONENT_LEFT, () => {
            alert("Opponent left the game!!!");
        });

        this._socket.on(SOCKET_EVENTS.STATE.NOTIFICATION, (msg) => {
            console.error("NOTIFICATION!!!:" + msg);
        });
    }
}

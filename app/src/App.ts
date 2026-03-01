import Loby from "./pages/Loby.js";
import { Socket } from "socket.io";
import { Menu } from "./pages/Menu.js";
import { SOCKET_EVENTS, VIEWS } from "./util/ClientConstants.js";
import Page from "./Page.js";
import { Partial } from "./util/Partials.js";
import { Store } from "./Store.js";
import { Slagalica } from "./pages/Slagalica.js";
import { MojBroj } from "./pages/MojBroj.js";

declare const io: any;

interface Views {
    loby: Loby;
    menu: Menu;
    slagalica: Slagalica;
    mojBroj: MojBroj;
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
            // this._store.setState__((prevState:any) => {
            //     if (!prevState) return null;
            //     return {
            //         ...prevState,
            //         gameState: {
            //             ...prevState.gameState,
            //             [gameKey]: gameState,
            //         },
            //     };
            // });
        });

        this._socket.on(SOCKET_EVENTS.STATE.PLAYERS_STATE, ({state}) => {
            this._store.setState__(state);
            console.log(state);
            console.log("ode", this._store.getState__);
            
            
        })

        this._socket.on(SOCKET_EVENTS.CORE.OPPONENT_LEFT, () => {
            alert("Opponent left the game!!!")
        })
    }
}

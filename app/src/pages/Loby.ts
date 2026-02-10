import { Socket } from "socket.io";
import Page from "../Page.js";
import { FetchHTML } from "../util/FetchHTML.js";

interface LocalDomElements {
    createGameBtn: HTMLElement;
    joinGame: HTMLElement;
    gameIdInput: HTMLInputElement;
    singlePlayer: HTMLElement;
    randomGame: HTMLElement;
    usernameInp: HTMLInputElement;
}

export default class Loby extends Page {
    private _localDom!: LocalDomElements;
    private _gameMode: string | null;
    private _gameId: string | null;
    private _socket: Socket;
    private _username: string;

    constructor(socket:Socket) {
        super();

        this._gameMode = null;
        this._gameId = null;
        this._socket = socket;
        this._username = `User-${Date.now()}`;
    }

    async init() {
        const lobyHTML = await FetchHTML("../views/loby.html");
        if (this._domElements.gameContainer) {
            this._domElements.gameContainer.innerHTML = lobyHTML;
        }

        this._localDom = {
            createGameBtn: document.querySelector("#createGameBtn")!,
            joinGame: document.querySelector("#joinGame")!,
            gameIdInput: document.querySelector("#gameIdInput")!,
            singlePlayer: document.querySelector("#singlePlayer")!,
            randomGame: document.querySelector("#randomGame")!,
            usernameInp: document.querySelector(".username-inp")!,
        };

        this._setUsername__();

        this._addEvents(this._localDom.randomGame, "click", this._playRandomGame__.bind(this))
        this._addEvents(this._localDom.usernameInp, "input", this._changeUsername__.bind(this))
        this._addEvents(this._localDom.createGameBtn,"click", this._setGameId__.bind(this))
    }

    _playRandomGame__() {
        if (this._localDom.usernameInp && this._localDom.usernameInp.value) {
            this._socket.emit('enterRoom', {
                name: this._localDom.usernameInp.value,
                game: this._gameId
            });
        } else {
            this._localDom.usernameInp?.classList.add("missing-username-input");
            this._localDom.usernameInp?.setAttribute("placeholder", "Enter username");
        }
    }

    _setUsername__() {
        const saved = localStorage.getItem("slagalicaUsername");

        if (saved) {
            this._username = saved;
        } else {
            this._username = `User-${Date.now()}`;
            localStorage.setItem("slagalicaUsername", this._username);
        }

        this._localDom.usernameInp.value = this._username;
    }

    _changeUsername__(event: Event)
    {
        const newUsername = (event.target as HTMLInputElement).value;
        console.log(newUsername);
        
        localStorage.setItem("slagalicaUsername", newUsername);
    }

    _createGameId__() {
        const gid = () => {
            return Math.floor(Math.random() * 900) + 99;
        };
        return gid() + "-" + gid() + "-" + gid();
    }

    _setGameId__(){
        this._gameId = this._createGameId__();
        this._localDom.gameIdInput.value = this._gameId
    }
}
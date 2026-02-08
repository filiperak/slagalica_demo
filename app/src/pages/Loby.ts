import Page from "../Page.js";
import { FetchHTML } from "../util/FetchHTML.js";

interface localDOmElements {
    createGame: HTMLElement | null;
    joinGame: HTMLElement | null;
    gameIdInput: HTMLInputElement | null;
    singlePlayer: HTMLElement | null;
    randomGame: HTMLElement | null;
    usernameInp: HTMLInputElement | null;
}

export default class Loby extends Page {
    _localDom: localDOmElements;
    _gameMode: string | null;
    _gameId: string | null;
    _socket: string;

    constructor(socket:string) {
        super();
        this._localDom = {
            createGame: null,
            joinGame: null,
            gameIdInput: null,
            singlePlayer: null,
            randomGame: null,
            usernameInp: null,
        };
        this._gameMode = null;
        this._gameId = null;
        this._socket = socket;
    }

    async init() {
        const lobyHTML = await FetchHTML("../views/loby.html");
        if (this._domElements.gameContainer) {
            this._domElements.gameContainer.innerHTML = lobyHTML;
        }

        this._localDom = {
            createGame: document.querySelector("#createGame"),
            joinGame: document.querySelector("#joinGame"),
            gameIdInput: document.querySelector("#gameIdInput"),
            singlePlayer: document.querySelector("#singlePlayer"),
            randomGame: document.querySelector("#randomGame"),
            usernameInp: document.querySelector(".username-inp"),
        };

        this._setUsername__();
    }

    _joinGame__() {
        if (this._localDom.usernameInp && this._localDom.usernameInp.value) {

            if(this._gameMode === "single") {
                this._gameId = this._createGameId__();
            }
        } else {

            this._localDom.usernameInp?.classList.add("missing-username-input");
            this._localDom.usernameInp?.setAttribute("placeholder", "Enter username");
        }
    }

    _setUsername__() {
        const savedUsername = localStorage.getItem("slagalicaUsername");
        if (savedUsername && this._localDom.usernameInp) {
            this._localDom.usernameInp.value = savedUsername;
        }
    }

    _createGameId__() {
        const gid = () => {
            return Math.floor(Math.random() * 900) + 99;
        };
        return gid() + "-" + gid() + "-" + gid();
    }
}
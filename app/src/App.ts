declare const io: any;

interface AppDomElements {
    createGame: HTMLElement | null;
    joinGame: HTMLElement | null;
    gameIdInput: HTMLInputElement | null;
    singlePlayer: HTMLElement | null;
    randomGame: HTMLElement | null;
    gameContainer: HTMLElement | null;
    usernameInp: HTMLInputElement | null;
}

export default class App {

    _domElements: AppDomElements;
    _ioUrl: string
    _socket: any;

    constructor(ioUrl:string) {
        
        this._domElements = {
            createGame: document.querySelector("#createGame"),
            joinGame: document.querySelector("#joinGame"),
            gameIdInput: document.querySelector("#gameIdInput"),
            singlePlayer: document.querySelector("#singlePlayer"),
            randomGame: document.querySelector("#randomGame"),
            gameContainer: document.querySelector("#gameContainer"),
            usernameInp: document.querySelector(".username-inp")

        };

        this._ioUrl = ioUrl;
        this._socket = io(ioUrl);

    }

    init() {
        this._setUsername__();

    }

    _setUsername__() {
        const savedUsername = localStorage.getItem("slagalicaUsername")
        if (savedUsername && this._domElements.usernameInp) {
            this._domElements.usernameInp.value = savedUsername;
        }
    }

    


}
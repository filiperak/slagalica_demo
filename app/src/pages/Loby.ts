import { Socket } from "socket.io-client";
import Page from "../Page";
import { FetchHTML } from "../util/Util";
import { Partial } from "../util/Partials";
import { SOCKET_EVENTS } from "../util/ClientConstants";
import { Store } from "../Store";
import { ThemeService } from "../util/ThemeService";
import App from "../App";

interface LocalDomElements {
    createGameBtn: HTMLElement;
    avatarName: HTMLElement;
    joinGame: HTMLElement;
    gameIdInput: HTMLInputElement;
    singlePlayer: HTMLElement;
    randomGame: HTMLElement;
    usernameInp: HTMLInputElement;
    headerActions: HTMLDivElement;
    themeToggleBtn: HTMLButtonElement;
}

interface HeaderDomElements {}

export default class Loby extends Page {
    private _localDom!: LocalDomElements;
    private _headerActions!: HeaderDomElements;
    private _gameMode: string | null;
    private _gameId: string | null;
    private _username: string;
    private _dedicatedGameId: string | null;

    private _partial: Partial;

    constructor(socket: Socket, partial: Partial, store: Store, app: App) {
        super(socket, store, app);
        this._partial = partial;

        this._gameMode = null;
        this._gameId = null;
        this._dedicatedGameId = null;
        this._socket = socket;
        this._username = `User-${Date.now()}`;
    }

    async init() {
        const lobyHTML = await FetchHTML("/views/loby.html");
        this._domElements.gameContainer.innerHTML = lobyHTML;

        this._localDom = {
            createGameBtn: document.querySelector("#createGameBtn")!,
            joinGame: document.querySelector("#joinGame")!,
            gameIdInput: document.querySelector("#gameIdInput")!,
            singlePlayer: document.querySelector("#singlePlayer")!,
            randomGame: document.querySelector("#randomGame")!,
            usernameInp: document.querySelector(".username-inp")!,
            headerActions: document.querySelector("#headerActions")!,
            themeToggleBtn: document.querySelector("#themeToggleBtn")!,
            avatarName: document.querySelector("#avatarName")!,
        };

        this._headerActions = {
            settings: {
                icon: "",
                action: "",
                option: "",
            },
            language: {
                icon: "",
                action: "",
                option: "",
            },
            theme: {
                icon: "",
                action: "",
                option: "",
            },
            sound: {
                icon: "",
                action: "",
                option: "",
            },
        };

        this.setUsername();

        this.addEvents(this._localDom.randomGame, "click", this.playRandomGame.bind(this));
        this.addEvents(this._localDom.singlePlayer, "click", this.playSinglePlayer.bind(this));
        this.addEvents(this._localDom.joinGame, "click", this.joinViaCode.bind(this));
        this.addEvents(this._localDom.usernameInp, "input", this.changeUsername.bind(this));
        this.addEvents(this._localDom.createGameBtn, "click", this.setGameId.bind(this));

        this.updateThemeIcon();
        this.addEvents(this._localDom.themeToggleBtn, "click", () => {
            ThemeService.toggle();
            this.updateThemeIcon();
        });
        this.handleLangSelectionClick();
    }

    playRandomGame() {
        if (this._localDom.usernameInp && this._localDom.usernameInp.value) {
            this._socket.emit("enterRoom", {
                name: this._localDom.usernameInp.value,
                game: this._gameId,
            });
            this._partial.showModal({
                title: "Čekamo protivnika!",
                text: "Pogrešan kod za sobu. Pokušajte ponovo.",
                primaryText: "Odustani",
                spinner: true,
                primaryAction: this.leaveGame.bind(this),
            });
        } else {
            this._localDom.usernameInp?.classList.add("missing-username-input");
            this._localDom.usernameInp?.setAttribute("placeholder", "Enter username");
        }
    }

    playSinglePlayer() {
        if (this._localDom.usernameInp && this._localDom.usernameInp.value) {
            this._socket.emit(SOCKET_EVENTS.CORE.ENTER_SINGLE_PLAYER, {
                name: this._localDom.usernameInp.value,
                game: null,
            });

            this._partial.showModal({
                title: "Čekamo protivnika!",
                text: `Podelite ovaj kod: ${this._dedicatedGameId} sa saigračem`,
                primaryText: "Odustani",
                spinner: true,
                primaryAction: this.leaveGame.bind(this),
            });
        } else {
            this._localDom.usernameInp?.classList.add("missing-username-input");
            this._localDom.usernameInp?.setAttribute("placeholder", "Enter username");
        }
    }

    joinViaCode() {
        if (this._localDom.usernameInp && this._localDom.usernameInp.value) {
            this._socket.emit(SOCKET_EVENTS.CORE.ENTER_ROOM, {
                name: this._localDom.usernameInp.value,
                game: this._localDom.gameIdInput.value,
            });

            this._partial.showModal({
                title: "Igra se učitava!",
                text: `Podelite ovaj kod: ${this._dedicatedGameId} sa saigračem`,
                primaryText: "Odustani",
                spinner: true,
                primaryAction: this.leaveGame.bind(this),
            });
        } else {
            this._localDom.usernameInp?.classList.add("missing-username-input");
            this._localDom.usernameInp?.setAttribute("placeholder", "Enter username");
        }
    }

    setUsername() {
        const saved = localStorage.getItem("slagalicaUsername");

        if (saved) {
            this._username = saved;
        } else {
            this._username = `User-${Date.now()}`;
            localStorage.setItem("slagalicaUsername", this._username);
        }
        this._localDom.usernameInp.value = this._username;
    }

    changeUsername(event: Event) {
        const newUsername = (event.target as HTMLInputElement).value;
        console.log(newUsername);

        localStorage.setItem("slagalicaUsername", newUsername);
        this._localDom.avatarName.innerText = newUsername.trim().slice(0, 2);
    }

    createGameId() {
        const gid = () => {
            return Math.floor(Math.random() * 900) + 99;
        };
        return gid() + "-" + gid() + "-" + gid();
    }

    setGameId() {
        this._dedicatedGameId = this.createGameId();
        console.log(this._localDom.gameIdInput);

        this._localDom.gameIdInput.value = this._dedicatedGameId;
    }

    updateThemeIcon() {
        const img = this._localDom.themeToggleBtn.querySelector("img")!;
        const theme = ThemeService.get();
        img.src =
            theme === "dark" ? "./assets/icon-theme-dark.svg" : "./assets/icon-theme-light.svg";
    }

    leaveGame() {
        this._socket.emit(SOCKET_EVENTS.CORE.LEAVE_GAME);
        this._gameId = null;
        this._gameMode = null;
        this._partial.hideModal();
    }

    handleLangSelectionClick() {
        const picker =
            this._localDom.headerActions.querySelector<HTMLButtonElement>("#languagePicker")!;
        const menu =
            this._localDom.headerActions.querySelector<HTMLUListElement>("#languagePickerMenu")!;

        this.addEvents(picker, "click", (e) => {
            e.stopPropagation();
            menu.classList.toggle("hidden");
        });

        this.addEvents(menu, "click", (e) => {
            const option = (e.target as HTMLElement).closest<HTMLElement>("[data-lang]");
            if (option) {
                console.log(option.dataset.lang);
                menu.classList.add("hidden");
            }
        });

        document.addEventListener(
            "click",
            (e) => {
                if (!picker.contains(e.target as Node)) {
                    menu.classList.add("hidden");
                }
            },
            { capture: true }
        );
    }
}

import { Socket } from "socket.io-client";
import Page from "../Page";
import { FetchHTML } from "../util/Util";
import { Partial } from "../util/Partials";
import { SOCKET_EVENTS } from "../util/ClientConstants";
import { Store } from "../Store";
import { ThemeService } from "../util/ThemeService";
import { SoundService } from "../util/SoundService";
import { I18nService, Lang } from "../util/I18n";
import App from "../App";

interface LocalDomElements {
    createGameBtn: HTMLElement;
    avatarName: HTMLElement;
    joinGame: HTMLButtonElement;
    gameIdInput: HTMLInputElement;
    singlePlayer: HTMLElement;
    randomGame: HTMLElement;
    usernameInp: HTMLInputElement;
    headerActions: HTMLDivElement;
    themeToggleBtn: HTMLButtonElement;
    toggleSoundBtn: HTMLButtonElement;
}

export default class Loby extends Page {
    private _localDom!: LocalDomElements;
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
        await I18nService.load("loby");
        I18nService.translate(this._domElements.gameContainer, "loby");

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
            toggleSoundBtn: document.querySelector("#soundAction")!,
        };

        this._localDom.joinGame.disabled = true;
        this._localDom.joinGame.classList.add("opacity-50", "cursor-not-allowed");

        this.setUsername();

        this.addEvents(this._localDom.randomGame, "click", this.playRandomGame.bind(this));
        this.addEvents(this._localDom.singlePlayer, "click", this.playSinglePlayer.bind(this));
        this.addEvents(this._localDom.joinGame, "click", this.joinViaCode.bind(this));
        this.addEvents(this._localDom.usernameInp, "input", this.changeUsername.bind(this));
        this.addEvents(this._localDom.createGameBtn, "click", this.setGameId.bind(this));
        this.addEvents(this._localDom.toggleSoundBtn, "click", this.handleSoundChange.bind(this));

        this.addEvents(this._localDom.gameIdInput, "input", () => {
            const hasValue = this._localDom.gameIdInput.value.trim().length > 0;
            this._localDom.joinGame.disabled = !hasValue;
            this._localDom.joinGame.classList.toggle("opacity-50", !hasValue);
            this._localDom.joinGame.classList.toggle("cursor-not-allowed", !hasValue);
            if (hasValue) {
                this._localDom.gameIdInput.classList.remove("border-red-500");
            }
        });

        this.updateThemeIcon();
        this.updateSoundIcon();
        this.addEvents(this._localDom.themeToggleBtn, "click", () => {
            ThemeService.toggle();
            this.updateThemeIcon();
        });
        this.handleLangSelectionClick();
        SoundService.play();
    }

    private _sanitizeInput(str: string, maxLen: number = 20): string {
        return str
            .replace(/[<>"'`&;]/g, "")
            .trim()
            .slice(0, maxLen);
    }

    playRandomGame() {
        const username = this._sanitizeInput(this._localDom.usernameInp?.value ?? "");
        if (username) {
            this._socket.emit("enterRoom", {
                name: username,
                game: this._gameId,
            });
            this._partial.showModal({
                title: I18nService.getMessage("loby", "waiting_opponent"),
                text: I18nService.getMessage("loby", "share_code"),
                primaryText: I18nService.getMessage("loby", "cancel"),
                spinner: true,
                primaryAction: this.leaveGame.bind(this),
            });
        } else {
            this._localDom.usernameInp?.classList.add("missing-username-input");
            this._localDom.usernameInp?.setAttribute(
                "placeholder",
                I18nService.getMessage("loby", "enter_username")
            );
        }
    }

    playSinglePlayer() {
        const username = this._sanitizeInput(this._localDom.usernameInp?.value ?? "");
        if (username) {
            this._socket.emit(SOCKET_EVENTS.CORE.ENTER_SINGLE_PLAYER, {
                name: username,
                game: null,
            });

            this._partial.showModal({
                title: I18nService.getMessage("loby", "waiting_opponent"),
                text: I18nService.getMessage("loby", "share_code"),
                primaryText: I18nService.getMessage("loby", "cancel"),
                spinner: true,
                primaryAction: this.leaveGame.bind(this),
            });
        } else {
            this._localDom.usernameInp?.classList.add("missing-username-input");
            this._localDom.usernameInp?.setAttribute(
                "placeholder",
                I18nService.getMessage("loby", "enter_username")
            );
        }
    }

    joinViaCode() {
        const username = this._sanitizeInput(this._localDom.usernameInp?.value ?? "");
        const gameId = this._sanitizeInput(this._localDom.gameIdInput.value, 15);

        if (!gameId) {
            this._localDom.gameIdInput.classList.add("border-red-500");
            return;
        }

        if (username) {
            this._socket.emit(SOCKET_EVENTS.CORE.ENTER_ROOM, {
                name: username,
                game: gameId,
            });

            this._partial.showModal({
                title: I18nService.getMessage("loby", "game_loading"),
                text: I18nService.getMessage("loby", "share_code"),
                primaryText: I18nService.getMessage("loby", "cancel"),
                spinner: true,
                primaryAction: this.leaveGame.bind(this),
            });
        } else {
            this._localDom.usernameInp?.classList.add("missing-username-input");
            this._localDom.usernameInp?.setAttribute(
                "placeholder",
                I18nService.getMessage("loby", "enter_username")
            );
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
        const raw = (event.target as HTMLInputElement).value;
        const sanitized = this._sanitizeInput(raw);
        localStorage.setItem("slagalicaUsername", sanitized);
        this._localDom.avatarName.innerText = sanitized.trim().slice(0, 2);
    }

    createGameId() {
        const gid = () => {
            return Math.floor(Math.random() * 900) + 99;
        };
        return gid() + "-" + gid() + "-" + gid();
    }

    setGameId() {
        this._dedicatedGameId = this.createGameId();
        this._localDom.gameIdInput.value = this._dedicatedGameId;
        this._localDom.joinGame.disabled = false;
        this._localDom.joinGame.classList.remove("opacity-50", "cursor-not-allowed");
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

        this.addEvents(menu, "click", async (e) => {
            const option = (e.target as HTMLElement).closest<HTMLElement>("[data-lang]");
            if (option) {
                const lang = option.dataset.lang as Lang;
                I18nService.set(lang);
                await Promise.all([I18nService.load("loby"), I18nService.load("common")]);
                I18nService.translate(this._domElements.gameContainer, "loby");
                I18nService.translate(document.body, "common");
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

    handleSoundChange(): void {
        SoundService.toggle();
        this.updateSoundIcon();
    }

    updateSoundIcon(): void {
        const img = this._localDom.toggleSoundBtn.querySelector("img")!;
        img.src = SoundService.isMuted()
            ? "./assets/icon-sound-off.svg"
            : "./assets/icon-sound-on.svg";
    }
}

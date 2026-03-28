import { Socket } from "socket.io-client";
import Page from "../Page";
import { Store } from "../Store";
import { GAME_KEYS, SOCKET_EVENTS } from "../util/ClientConstants";
import { Partial } from "../util/Partials";
import { FetchHTML } from "../util/Util";
import { I18nService } from "../I18n";
import App from "../App";

interface KoznaznaQuestion {
    question: string;
    answer: string;
    wrong: [string, string, string];
}

interface LocalDomElements {
    questionCounter: HTMLElement;
    runningScore: HTMLElement;
    questionText: HTMLElement;
    optionsContainer: HTMLElement;
    skipBtn: HTMLButtonElement;
}

interface GameData {
    questions: KoznaznaQuestion[];
    gameId: string;
}

export class KoZnaZna extends Page {
    private _localDom!: LocalDomElements;
    private _gameData!: GameData;
    private _partial: Partial;

    private _qCounter: number = 0;
    private _score: number = 0;
    private _submitted: boolean = false;
    private _locked: boolean = false;

    constructor(socket: Socket, store: Store, app: App, partial: Partial) {
        super(socket, store, app);
        this._partial = partial;
    }

    async init() {
        super.init();
        this._qCounter = 0;
        this._score = 0;
        this._submitted = false;
        this._locked = false;

        this._domElements.gameContainer.innerHTML = await FetchHTML("/views/koznazna.html");
        await I18nService.load("koznazna");
        I18nService.translate(this._domElements.gameContainer, "koznazna");

        this._localDom = {
            questionCounter: document.querySelector("#question-counter")!,
            runningScore: document.querySelector("#running-score")!,
            questionText: document.querySelector("#question-text")!,
            optionsContainer: document.querySelector("#options-container")!,
            skipBtn: document.querySelector("#skip-btn")!,
        };

        const state = this._store.getState();
        this._gameData = {
            questions: state?.gameState.koznazna ?? [],
            gameId: state?.gameId ?? "",
        };

        this.initHeader();
        this._renderQuestion();
        this._registerSocketEvents();

        this.addEvents(this._localDom.skipBtn, "click", this._handleSkip.bind(this));
        this.addEvents(document.body, "timeExpired", this._timeExpired.bind(this));
    }

    private _renderQuestion(): void {
        const q = this._gameData.questions[this._qCounter];
        const total = this._gameData.questions.length;

        this._localDom.questionCounter.textContent = I18nService.getMessage("koznazna", "question_counter")
            .replace("{n}", String(this._qCounter + 1))
            .replace("{total}", String(total));
        this._localDom.questionText.textContent = q.question;
        this._localDom.optionsContainer.innerHTML = "";
        this._locked = false;

        const options = this._shuffle([...q.wrong, q.answer]);

        options.forEach((option) => {
            const btn = document.createElement("button");
            btn.textContent = option;
            btn.className = [
                "py-3 px-4 text-sm font-medium text-content",
                "bg-surface-raised border border-white/[0.06]",
                "hover:border-brand/60 hover:bg-surface-overlay hover:text-white",
                "rounded-lg transition-all active:scale-95 text-center leading-snug",
            ].join(" ");

            this.addEvents(btn, "click", () => this._handleAnswer(btn, option));
            this._localDom.optionsContainer.appendChild(btn);
        });
    }

    private _handleAnswer(btn: HTMLButtonElement, selected: string): void {
        if (this._locked || this._submitted) return;
        this._locked = true;

        const correct = this._gameData.questions[this._qCounter].answer;
        const isCorrect = selected === correct;

        if (isCorrect) {
            btn.classList.add("bg-positive", "border-positive", "text-white");
            this._socket.emit(SOCKET_EVENTS.GAMES.KO_ZNA_ZNA.SUBMIT, {
                gameId: this._gameData.gameId,
                points: 3,
            });
        } else {
            btn.classList.add("bg-negative/20", "border-negative", "text-negative");
            this._highlightCorrect(correct);
            this._socket.emit(SOCKET_EVENTS.GAMES.KO_ZNA_ZNA.SUBMIT, {
                gameId: this._gameData.gameId,
                points: -1,
            });
        }

        this._localDom.skipBtn.disabled = true;
        setTimeout(() => this._advance(), 900);
    }

    private _handleSkip(): void {
        if (this._locked || this._submitted) return;
        this._locked = true;

        this._highlightCorrect(this._gameData.questions[this._qCounter].answer);
        this._localDom.skipBtn.disabled = true;
        setTimeout(() => this._advance(), 900);
    }

    private _highlightCorrect(correct: string): void {
        const btns = this._localDom.optionsContainer.querySelectorAll<HTMLButtonElement>("button");
        btns.forEach((b) => {
            if (b.textContent === correct) {
                b.classList.add("bg-positive", "border-positive", "text-white");
            }
        });
    }

    private _advance(): void {
        this._qCounter++;
        if (this._qCounter < this._gameData.questions.length) {
            this._localDom.skipBtn.disabled = false;
            this._renderQuestion();
        } else {
            this._finish();
        }
    }

    private _finish(): void {
        if (this._submitted) return;
        this._submitted = true;
        this.clearTimer();
        this._socket.emit(SOCKET_EVENTS.GAMES.KO_ZNA_ZNA.END, {
            gameId: this._gameData.gameId,
        });
    }

    private _timeExpired(): void {
        this._finish();
    }

    private _registerSocketEvents(): void {
        this.addSocketEvents(
            SOCKET_EVENTS.GAMES.KO_ZNA_ZNA.ADD_POINTS,
            (data: { data: number }) => {
                this._score = data.data;
                this._localDom.runningScore.textContent = I18nService.getMessage("koznazna", "score")
                    .replace("{n}", String(this._score));
            }
        );

        this.addSocketEvents(SOCKET_EVENTS.GAMES.KO_ZNA_ZNA.SUCCESS, (result: { data: number }) => {
            this._partial.showModal({
                title: "Igra gotova!",
                text: `Osvojili ste ${result.data} poena`,
                primaryText: "Zatvori",
                secondaryText: "Sledeće",
                secondaryAction: () =>
                    this._socket.emit(SOCKET_EVENTS.STATE.OPEN_GAME, {
                        gameId: this._gameData.gameId,
                        gameKey: GAME_KEYS.ASOCIJACIJE,
                        playerId: this._socket.id,
                    }),
            });
        });
    }

    private _shuffle<T>(arr: T[]): T[] {
        return arr.sort(() => Math.random() - 0.5);
    }
}

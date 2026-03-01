import { Socket } from "socket.io";
import Page from "../Page.js";
import { Store, GameState } from "../Store.js";
import { RouerFn } from "../util/Types.js";
import { SOCKET_EVENTS, VIEWS } from "../util/ClientConstants.js";
import { Partial } from "../util/Partials.js";

export class Slagalica extends Page {

    constructor(socket: Socket, store: Store, router: RouerFn, partial: Partial) {
        super(socket, store, router, partial);
    }

    init() {
        super.init();
        this._domElements.gameContainer.innerHTML = `
            <h1>Slagalica</h1>
            <button id="submitAnswer">Potvrdi odgovor</button>
        `;

        this.initHeader__({
            durationSeconds: 90,
            timeoutMessage: "Vreme za Slagalicu je isteklo!",
            description: "Slagalica",
            backMessage: "Da li ste sigurni da želite da napustite Slagalicu?",
        });

        // Scenario 3 — user submits their answer
        const submitBtn = this._domElements.gameContainer.querySelector("#submitAnswer") as HTMLElement;
        if (submitBtn) {
            this.addEvents__(submitBtn, "click", () => {
                this.onGameComplete__("Potvrdi rezultat", () => {
                    // Replace with real submit logic, e.g.:
                    // this._socket.emit(SOCKET_EVENTS.SLAGALICA_SUBMIT, { answer: this._currentAnswer });
                    console.log("Slagalica result submitted, proceeding...");
                    this.go(VIEWS.MOJ_BROJ);
                });
            });
        }
    }
}
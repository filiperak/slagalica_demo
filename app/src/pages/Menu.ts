import { Socket } from "socket.io";
import Page from "../Page.js";
import { FetchHTML } from "../util/FetchHTML.js";
import { Store, GameState } from "../Store.js";

export class Menu extends Page {
    private _socket: Socket;
    private _unsub: (() => void) | null = null;

    constructor(socket: Socket, store: Store) {
        super(store);
        this._socket = socket;
    }

    async init() {
        const menuHTML = await FetchHTML("../views/menu.html");
        this._domElements.gameContainer.innerHTML = menuHTML;
        const initialState = this._store.getState__();
        if (initialState) {
            //this.render(initialState);
        }
        console.log(initialState);

        // 3. Subscribe: Listen for future changes (e.g. score updates)
        // We save the unsubscribe function to clean up later
        this._unsub = this._store.subscribe((state: GameState) => {
            console.log("Store updated, re-rendering Menu...");
            //this.render(state);
        });

        // 4. Setup local UI events (if any)
        this._setupLocalEvents__();
    }

    _setupLocalEvents__() {
        // Example: If you have a 'leave' button in menu.html
        const leaveBtn = document.querySelector("#leave-btn") as HTMLElement;
        if (leaveBtn) {
            this._addEvents(leaveBtn, "click", () => {
                this._socket.emit("leave_game");
            });
        }
    }

    /**
     * The Render method updates specific DOM elements based on the Store state.
     * This avoids refreshing the whole page.
     */
    render(state: GameState): void {
        if (!state || !state.players) return;

        // 1. Define the game keys exactly as they appear in your Socket JSON and HTML IDs
        const gameKeys = ["slagalica", "mojBroj", "spojnice", "skocko", "koZnaZna", "asocijacije"];

        // 2. Loop through players (supporting up to 2 as per your HTML)
        state.players.forEach((player, index) => {
            // --- Update Player Name ---
            const nameEl = document.getElementById(`p${index}-name`);
            if (nameEl) {
                nameEl.textContent = player.name || `Igrač ${index + 1}`;
            }

            // --- Update Total Score ---
            const totalEl = document.getElementById(`p${index}-total`);
            if (totalEl) {
                totalEl.textContent = player.score.total.toString();
            }

            // --- Update Individual Game Scores ---
            gameKeys.forEach((gameKey) => {
                const scoreEl = document.getElementById(`p${index}-${gameKey}`);
                if (scoreEl) {
                    // Navigate the nested JSON: player.score.games.slagalica.score
                    // We use optional chaining ?. and nullish coalescing ?? to prevent crashes
                    const gameData = player.score.games[gameKey as keyof typeof player.score.games];
                    const scoreValue = gameData?.score ?? 0;

                    scoreEl.textContent = scoreValue.toString();
                }
            });
        });
    }

    /**
     * @description Clean up both DOM events (via super) and the Store subscription.
     */
    _dispose() {
        super._dispose();
        // Kill the store subscription to prevent memory leaks
        if (this._unsub) {
            this._unsub();
            this._unsub = null;
        }
    }
}

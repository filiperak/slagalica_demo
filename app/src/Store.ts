export interface GameState {
    gameCompleted: boolean;
    gameId: string;
    gameState: {
        asocijacije: any;
        mojBroj: any;
        skocko: any;
        slagalica: {
            letterComb: string[];
            word: string;
        };
        spojnice: any;
    };
    players: any[];
}

export class Store {
    private _state: GameState | null = null;
    private _listeners: Array<(state: GameState) => void> = [];

    /**
     * @param newState 
     * @description Updates state and triggers UI refreshes
     */
    setState__(newState: any) {
        this._state = newState;
        this._listeners.forEach(listener => listener(this._state!));
    }

    getState__() {
        return this._state;
    }

    /**
     * @param {state} newState The new state to set, which will trigger all subscribed listeners    
     * @returns Pages call this to "listen" for data changes
     */
    subscribe(fn: (state: GameState) => void) {
        this._listeners.push(fn);
        return () => {
            this._listeners = this._listeners.filter(l => l !== fn);
        };
    }
}
// ---------------------------------------------------------------------------
// Event Bus
// ---------------------------------------------------------------------------

/** Strict map of every bus event → its payload shape. */
export interface GameEventMap {
    "game:complete":  { gameId: string };
    "game:timeout":   { gameId: string };
    "round:start":    { roundIndex: number };
    "player:scored":  { playerId: string; points: number };
}

type BusHandler<K extends keyof GameEventMap> = (payload: GameEventMap[K]) => void;

export class EventBus {
    /** Map<eventName, Set<handler>> — Set prevents duplicate registrations. */
    private readonly _listeners = new Map<string, Set<Function>>();

    /**
     * Deduplicate *emissions* by an optional caller-supplied id.
     * Useful when the same socket packet can arrive more than once.
     */
    private readonly _seenIds = new Set<string>();

    on<K extends keyof GameEventMap>(event: K, handler: BusHandler<K>): () => void {
        if (!this._listeners.has(event)) this._listeners.set(event, new Set());
        this._listeners.get(event)!.add(handler);
        return () => this._listeners.get(event)?.delete(handler);
    }

    off<K extends keyof GameEventMap>(event: K, handler: BusHandler<K>): void {
        this._listeners.get(event)?.delete(handler);
    }

    emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K], eventId?: string): void {
        if (eventId) {
            if (this._seenIds.has(eventId)) return;
            this._seenIds.add(eventId);
        }
        this._listeners.get(event)?.forEach(cb => (cb as BusHandler<K>)(payload));
    }

    /** Call between rounds / game resets to allow the same logical IDs again. */
    clearSeenIds(): void {
        this._seenIds.clear();
    }
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

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
    readonly bus = new EventBus();

    private _state: GameState | null = null;
    private _listeners: Array<(state: GameState) => void> = [];

    /**
     * @param newState
     * @description Updates state and triggers UI refreshes
     */
    setState__(newState: any) {
        this._state = newState;
        this._listeners.forEach((listener) => listener(this._state!));
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
            this._listeners = this._listeners.filter((l) => l !== fn);
        };
    }
}

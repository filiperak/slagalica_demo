// ── Game state shapes (mirror server/GameEngine.ts return values) ──────────────

interface SlagalicaState {
    letterComb: string[];
    word: string;
}

interface MojBrojState {
    numbers: number[];
    target: number;
    solution: string;
}

interface SpojniceItem {
    id: number;
    name: string;
}

interface SpojniceState {
    title: string;
    set: SpojniceItem[];
}

type SkockoState = number[];

interface KoznaznaQuestion {
    question: string;
    answer: string;
    wrong: [string, string, string];
}

type KoznaznaState = KoznaznaQuestion[];

interface AsocijacijeColumn {
    pojmovi: string[];
    rešenje: string;
    col: number;
}

interface AsocijacijeAsocijacija {
    columns: AsocijacijeColumn[];
    konačnoRešenje: string;
}

interface AsocijacijeState {
    asocijacija: AsocijacijeAsocijacija;
}

// ── Player shape (mirror server/GameEngine.ts addPlayer) ──────────────────────

export interface GameScore {
    opend: boolean;
    score: number;
}

interface PlayerScoreGames {
    slagalica: GameScore;
    mojBroj: GameScore;
    spojnice: GameScore;
    skocko: GameScore;
    koZnaZna: GameScore;
    asocijacije: GameScore;
}

interface PlayerScore {
    games: PlayerScoreGames;
    readonly total: number;
}

export interface Player {
    id: string;
    name: string;
    score: PlayerScore;
}

// ── Root state ─────────────────────────────────────────────────────────────────

export interface GameState {
    gameCompleted: boolean;
    gameId: string;
    gameState: {
        slagalica: SlagalicaState;
        mojBroj: MojBrojState;
        spojnice: SpojniceState;
        skocko: SkockoState;
        koznazna: KoznaznaState;
        asocijacije: AsocijacijeState;
    };
    players: Player[];
}

// ── Store ──────────────────────────────────────────────────────────────────────

export class Store {
    private _state: GameState | null = null;
    private _listeners: Array<(state: GameState) => void> = [];

    setState(newState: GameState) {
        this._state = newState;
        this._listeners.forEach((listener) => listener(this._state!));
    }

    getState() {
        return this._state;
    }

    subscribe(fn: (state: GameState) => void) {
        this._listeners.push(fn);
        return () => {
            this._listeners = this._listeners.filter((l) => l !== fn);
        };
    }
}

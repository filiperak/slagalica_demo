import { Game } from "../../server/GameEngine";

describe("Game class method tests", () => {
    let game: Game;

    beforeEach(() => {
        game = new Game("test_id_123");
    });

    // ── Initialisation ────────────────────────────────────────────────────────

    test("game should initialize with id", () => {
        expect(game.gameId).toBe("test_id_123");
    });

    test("initial gameState has all six minigame keys", () => {
        const keys = Object.keys(game.gameState);
        expect(keys).toEqual(
            expect.arrayContaining(["slagalica", "mojBroj", "spojnice", "skocko", "koznazna", "asocijacije"])
        );
    });

    test("gameCompleted is false on construction", () => {
        expect(game.gameCompleted).toBe(false);
    });

    // ── Player management ─────────────────────────────────────────────────────

    test("add a player", () => {
        game.addPlayer("p1", "Player One");
        expect(game.players.length).toBe(1);
        expect(game.players[0].name).toBe("Player One");
    });

    test("not adding more than two players", () => {
        game.addPlayer("p1", "Player One");
        game.addPlayer("p2", "Player Two");
        const result = game.addPlayer("p3", "Player Three");
        expect(result).toBe(false);
        expect(game.players.length).toBe(2);
    });

    test("addPlayer returns true when slot is available", () => {
        expect(game.addPlayer("p1", "Player One")).toBe(true);
    });

    test("remove a player", () => {
        game.addPlayer("p1", "Player One");
        game.addPlayer("p2", "Player Two");
        game.removePlayer("p1");
        expect(game.players.length).toBe(1);
        expect(game.players[0].id).toBe("p2");
    });

    test("get a player by id", () => {
        game.addPlayer("p1", "Player One");
        const player = game.getPlayer("p1");
        expect(player.name).toBe("Player One");
    });

    test("getPlayer returns undefined for unknown id", () => {
        expect(game.getPlayer("nonexistent")).toBeUndefined();
    });

    test("check if game is ready", () => {
        game.addPlayer("p1", "Player One");
        expect(game.isReady()).toBe(false);
        game.addPlayer("p2", "Player Two");
        expect(game.isReady()).toBe(true);
    });

    // ── Score ─────────────────────────────────────────────────────────────────

    test("testing add score method", () => {
        game.addPlayer("p1", "Player One");
        game.addScore("slagalica", "p1", 10);
        const player = game.getPlayer("p1");
        expect(player.score.games["slagalica"]).toEqual({ opend: false, score: 10 });
    });

    test("score total getter sums all game scores", () => {
        game.addPlayer("p1", "Player One");
        game.addScore("slagalica", "p1", 10);
        game.addScore("mojBroj", "p1", 20);
        expect(game.getPlayer("p1").score.total).toBe(30);
    });

    test("addScore accumulates across multiple calls", () => {
        game.addPlayer("p1", "Player One");
        game.addScore("slagalica", "p1", 5);
        game.addScore("slagalica", "p1", 7);
        expect(game.getPlayer("p1").score.games["slagalica"].score).toBe(12);
    });

    // ── Game completion ───────────────────────────────────────────────────────

    test("handle game completion", () => {
        game.addPlayer("p1", "Player One");
        game.addPlayer("p2", "Player Two");
        const gameKeys = ["slagalica", "mojBroj", "spojnice", "skocko", "koZnaZna", "asocijacije"];
        gameKeys.forEach((key) => {
            game.handleOpendGame(key, "p1");
            game.handleOpendGame(key, "p2");
        });
        expect(game.isCompleted()).toBe(true);
    });

    test("isCompleted returns false when only some games are opened", () => {
        game.addPlayer("p1", "Player One");
        game.addPlayer("p2", "Player Two");
        game.handleOpendGame("slagalica", "p1");
        game.handleOpendGame("slagalica", "p2");
        expect(game.isCompleted()).toBe(false);
    });

    test("markPlayerFinished / bothPlayersFinished", () => {
        game.addPlayer("p1", "Player One");
        game.addPlayer("p2", "Player Two");
        game.markPlayerFinished("p1");
        expect(game.bothPlayersFinished()).toBe(false);
        game.markPlayerFinished("p2");
        expect(game.bothPlayersFinished()).toBe(true);
    });

    test("bothPlayersFinished returns false with fewer than 2 players", () => {
        game.addPlayer("p1", "Player One");
        game.markPlayerFinished("p1");
        expect(game.bothPlayersFinished()).toBe(false);
    });

    // ── Winner ────────────────────────────────────────────────────────────────

    test("check the winner", () => {
        game.addPlayer("p1", "Player One");
        game.addPlayer("p2", "Player Two");
        game.addScore("slagalica", "p1", 10);
        game.addScore("slagalica", "p2", 5);
        const result = game.checkWinner();
        expect(result.winnerPlayer.id).toBe("p1");
        expect(result.loser!.id).toBe("p2");
        expect(result.draw).toBe(false);
    });

    test("checkWinner detects when p2 has a higher score", () => {
        game.addPlayer("p1", "Player One");
        game.addPlayer("p2", "Player Two");
        game.addScore("slagalica", "p2", 20);
        const result = game.checkWinner();
        expect(result.winnerPlayer.id).toBe("p2");
        expect(result.loser!.id).toBe("p1");
    });

    test("checkWinner returns draw when scores are equal", () => {
        game.addPlayer("p1", "Player One");
        game.addPlayer("p2", "Player Two");
        game.addScore("slagalica", "p1", 10);
        game.addScore("slagalica", "p2", 10);
        const result = game.checkWinner();
        expect(result.draw).toBe(true);
    });

    test("checkWinner with single player has null loser", () => {
        game.addPlayer("p1", "Player One");
        const result = game.checkWinner();
        expect(result.loser).toBeNull();
    });

    // ── Slagalica ─────────────────────────────────────────────────────────────

    test("createSlagalica should return an object with a word between 2 and 12 characters", () => {
        const w = game.createSlagalica();
        expect(w.word.length).toBeGreaterThan(1);
        expect(w.word.length).toBeLessThan(13);
    });

    test("createSlagalica letterComb has exactly 12 entries", () => {
        const { letterComb } = game.createSlagalica();
        expect(letterComb).toHaveLength(12);
    });

    test("createSlagalica letterComb contains the word's letters", () => {
        const { word, letterComb } = game.createSlagalica();
        const wordLetters = word.split("");
        wordLetters.forEach((letter) => {
            expect(letterComb).toContain(letter);
        });
    });

    test("validateSlagalica returns validated:true and correct score for valid word", () => {
        const word = game.gameState.slagalica.word;
        const result = game.validateSlagalica(word);
        expect(result.validated).toBe(true);
        expect(result.score).toBe(word.length * 2);
    });

    test("validateSlagalica returns validated:false and score 0 for invalid word", () => {
        const result = game.validateSlagalica("XXXXNOTAWORD");
        expect(result.validated).toBe(false);
        expect(result.score).toBe(0);
    });

    // ── Skocko ────────────────────────────────────────────────────────────────

    test("createSkocko returns an array of exactly 4 numbers", () => {
        const comb = game.createSkocko();
        expect(comb).toHaveLength(4);
    });

    test("createSkocko values are in range [0, 5]", () => {
        const comb = game.createSkocko();
        comb.forEach((n) => {
            expect(n).toBeGreaterThanOrEqual(0);
            expect(n).toBeLessThan(6);
        });
    });

    test("validateSkocko: all correct positions scores 30", () => {
        const correct = [...game.gameState.skocko];
        const result = game.validateSkocko(correct);
        expect(result.correctPositions).toBe(4);
        expect(result.score).toBe(30);
    });

    test("validateSkocko: no matches returns zeros", () => {
        game.gameState.skocko = [0, 0, 0, 0];
        const result = game.validateSkocko([1, 1, 1, 1]);
        expect(result.correctPositions).toBe(0);
        expect(result.correctNumbers).toBe(0);
        expect(result.score).toBe(0);
    });

    test("validateSkocko: correct numbers in wrong positions", () => {
        game.gameState.skocko = [0, 1, 2, 3];
        const result = game.validateSkocko([3, 2, 1, 0]);
        expect(result.correctPositions).toBe(0);
        expect(result.correctNumbers).toBe(4);
    });

    test("validateSkocko: partial correct positions", () => {
        game.gameState.skocko = [0, 1, 2, 3];
        const result = game.validateSkocko([0, 1, 5, 5]);
        expect(result.correctPositions).toBe(2);
    });

    // ── Spojnice ──────────────────────────────────────────────────────────────

    test("validateSpojnice returns d * 4", () => {
        expect(game.validateSpojnice(0)).toBe(0);
        expect(game.validateSpojnice(3)).toBe(12);
        expect(game.validateSpojnice(5)).toBe(20);
    });

    test("createSpojnice returns an object with title and set", () => {
        const spojnice = game.createSpojnice();
        expect(spojnice).toHaveProperty("title");
        expect(spojnice).toHaveProperty("set");
        expect(Array.isArray(spojnice.set)).toBe(true);
    });

    // ── Moj Broj ──────────────────────────────────────────────────────────────

    test("createMojBroj target is between 100 and 999", () => {
        const { target } = game.createMojBroj();
        expect(target).toBeGreaterThanOrEqual(100);
        expect(target).toBeLessThanOrEqual(999);
    });

    test("createMojBroj numbers array has 8 entries", () => {
        const { numbers } = game.createMojBroj();
        expect(numbers).toHaveLength(8);
    });

    test("validateMojBroj returns 30 for exact match", () => {
        const target = game.gameState.mojBroj.target;
        expect(game.validateMojBroj(String(target))).toBe(30);
    });

    test("validateMojBroj returns 20 when within 4 of target", () => {
        game.gameState.mojBroj.target = 500;
        expect(game.validateMojBroj("503")).toBe(20);
    });

    test("validateMojBroj returns 10 when within 9 of target", () => {
        game.gameState.mojBroj.target = 500;
        expect(game.validateMojBroj("508")).toBe(10);
    });

    test("validateMojBroj returns 0 for far-off result", () => {
        game.gameState.mojBroj.target = 500;
        expect(game.validateMojBroj("1")).toBe(0);
    });
});

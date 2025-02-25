// jest.mock("@paunovic/questionnaire");
import { Game } from "../server/services/game.js";

describe("Game class method tests", () => {
    let game;

    beforeEach(() => {
        game = new Game("test_id_123");
    });

    test("game should initialize with id", () => {
        expect(game.gameId).toBe("test_id_123");
    });

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

    test("check if game is ready", () => {
        game.addPlayer("p1", "Player One");
        expect(game.isReady()).toBe(false);
        game.addPlayer("p2", "Player Two");
        expect(game.isReady()).toBe(true);
    });

    test("handle game completion", () => {
        game.addPlayer("p1", "Player One");
        game.addPlayer("p2", "Player Two");
        game.handleOpendGame("slagalica", "p1");
        game.handleOpendGame("slagalica", "p2");
        expect(game.isCompleted()).toBe(false);
        game.handleOpendGame("mojBroj", "p1");
        game.handleOpendGame("mojBroj", "p2");
        game.handleOpendGame("spojnice", "p1");
        game.handleOpendGame("spojnice", "p2");
        game.handleOpendGame("skocko", "p1");
        game.handleOpendGame("skocko", "p2");
        game.handleOpendGame("koZnaZna", "p1");
        game.handleOpendGame("koZnaZna", "p2");
        game.handleOpendGame("asocijacije", "p1");
        game.handleOpendGame("asocijacije", "p2");
        expect(game.isCompleted()).toBe(true);
    });

    test("check the winner", () => {
        game.addPlayer("p1", "Player One");
        game.addPlayer("p2", "Player Two");
        game.addScore("slagalica", "p1", 10);
        game.addScore("slagalica", "p2", 5);
        const result = game.checkWinner();
        expect(result.winnerPlayer.id).toBe("p1");
        expect(result.loser.id).toBe("p2");
        expect(result.draw).toBe(false);
    });

    test("testing add score method", () => {
        game.addPlayer("p1","Player One")
        game.addScore("slagalica", "p1", 10)
        const player = game.getPlayer("p1")
        expect(player.score.games["slagalica"]).toEqual({"opend": false, "score": 10});
    })

    //gameplay methods

    test("testing cratateSlagalica method it shuld return a object with property word (string (x < word length < 13))",() => {
        const w = game.createSlagalica()
        expect(w.word.length).toBeGreaterThan(1);
        expect(w.word.length).toBeLessThan(13);
    })
});
export class Game {
    constructor(gameId) {
        this.gameId = gameId;
        this.players = [];
        this.gameCompleted = false;
        this.score = { player1: 0, player2: 0 };
        this.turn = 1;
    }

    addPlayer(id, name) {
        if (this.players.length < 2) {
            this.players.push({ id, name });
            return true;
        }
        return false; 
    }

    removePlayer(id) {
        this.players = this.players.filter((player) => player.id !== id);
    }

    getPlayer(id) {
        return this.players.find((player) => player.id === id);
    }

    // switchTurn() {
    //     this.turn = this.turn === 1 ? 2 : 1;
    // }

    updateScore(playerIndex, points) {
        if (playerIndex === 0) this.score.player1 += points;
        if (playerIndex === 1) this.score.player2 += points;
    }

    isReady() {
        return this.players.length === 2;
    }
}

export class Game {
    constructor(gameId) {
        this.gameId = gameId;
        this.players = [];
        this.gameCompleted = false;
    }

    addPlayer(id, name) {
        if (this.players.length < 2) {

            const playerScore = {
                games:{ 
                    slagalica:{opend:false,score:0},
                    mojBroj:{opend:false,score:0},
                    spojnice:{opend:false,score:0},
                    skocko:{opend:false,score:0},
                    koZnaZna:{opend:false,score:0},
                    asocijacije:{opend:false,score:0}
                },
                get total() {
                    return Object.values(this.games).reduce((total, game) => total + game.score, 0);
                }
            }
            this.players.push({ id, name,score:playerScore });
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

    updateScore(playerIndex, points) {
        if (playerIndex === 0) this.score.player1 += points;
        if (playerIndex === 1) this.score.player2 += points;
    }

    isReady() {
        return this.players.length === 2;
    }
    handleOpendGame(gameKey,playerId){
        this.players.forEach(player => {
            if(player.id === playerId){
                player.score.games[gameKey].opend = true
            }
        })
    }
}

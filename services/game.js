export class Game {
    constructor(gameId) {
        this.gameId = gameId;
        this.players = [];
        this.gameCompleted = false;
        //spoji score i player u jedan objekat
        this.score = { 
            player1:{
                games:{ 
                slagalica:{opend:false,score:0},
                mojBroj:{opend:false,score:0},
                spojnice:{opend:false,score:0},
                skocko:{opend:false,score:0},
                koZnaZna:{opend:false,score:0},
                asocijacije:{opend:false,score:0}
                },
                total:0
            },
            player2:{
                games:{ 
                    slagalica:{opend:false,score:0},
                    mojBroj:{opend:false,score:0},
                    spojnice:{opend:false,score:0},
                    skocko:{opend:false,score:0},
                    koZnaZna:{opend:false,score:0},
                    asocijacije:{opend:false,score:0}
                },
                total:0
            }
        };
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

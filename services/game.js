export class Game {
    constructor(gameId) {
        this.gameId = gameId;
        this.players = [];
        this.gameState = {
            slagalica: {
                
            },
            mojBroj: {
                
            },
            spojnice: {
                
            },
            skocko: {
                
            },
            koZnaZna: {
                
            },
            asocijacije: {
                
            }
        };
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
    createSlagalica(){
        const letters = ["A","B","C","Č","Ć","D","Đ","E","F","G","H","I","J","K","L","Lj","M","N","Nj","O","P","R","S","Š","T","U","V","Z","Ž"]
        
    }
}

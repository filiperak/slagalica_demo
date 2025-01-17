import {srDictCapital} from "../db/sr-latin-capital-dict.js"
export class Game {
    constructor(gameId) {
        this.gameId = gameId;
        this.players = [];
        this.gameState = {
            slagalica: this.createSlagalica(),
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
        const letters = ["A","B","C","Č","Ć","D","Đ","E","F","G","H","I","J","K","L","LJ","M","N","NJ","O","P","R","S","Š","T","U","V","Z","Ž"]
        const getRandomLongWord = (arr) => {
            while(true){
                const word = arr[Math.floor(Math.random() * arr.length)]
                if(word.length > 8 && word.length < 13){
                    return word
                }
            }
        }
        const getRandowLetter = (arr) =>  arr[Math.floor(Math.random () * arr.length)]
        const shuffle = (arr) => arr.sort(() => Math.random() - 0.5)    
        
        const wordCombination = () => {
            const maxLen = 12
            const word = getRandomLongWord(srDictCapital)
            const letterComb = []
            letterComb.push(word.split(""))
            for(let i = word.length; i < maxLen; i++){
                letterComb.push(getRandowLetter(letters))
            }
            return {word,letterComb:shuffle(letterComb.flat())}
        }
        return wordCombination()
    }
    validateSlagalica(str) {
        const isValid = srDictCapital.includes(str);
        const score = isValid ? str.length * 2 : 0; 
        return { validate: isValid, score };
    }
}

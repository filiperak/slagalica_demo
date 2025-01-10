export class GameUi{
    constructor(element,players,gameId,socket){
        this._element = element
        this._players = players
        this._gameId = gameId
        this._socket = socket
    }
    createGameMenu(){
        const menu = document.createElement("div")
        menu.classList.add("game-menu")
        const header = document.createElement("header")
        header.classList.add("game-menu--header")
        this._players.forEach(elem => {
            let name = document.createElement("p")
            name.innerText = elem.name
            header.append(name)
        })
        const exitBtn = document.createElement("div")
        exitBtn.classList.add("game-menu--exit-btn")
        exitBtn.innerText = "Leave"
        exitBtn.addEventListener("click",() => {
            this._socket.emit("leaveGame")
            this.removeEveryElement()
        })

        const games = ["slagalica","moj broj","spojnice","skočko","ko zna zna","asocijacije"]

        const gameOptions = document.createElement("div")
        gameOptions.classList.add("game-options")
        games.forEach(game => {
            const gameOption = document.createElement("gameOption")
            gameOption.classList.add("game-option")

            const gameOptionName = document.createElement("p")
            const gameClass = (g) => g.trim().replace(/\s+/g, '-')
            //console.log(gameClass(game));
            
            gameOptionName.classList.add(gameClass(game),"game-option--container")
            gameOptionName.innerText = game


            const scorePOne = document.createElement("p")
            scorePOne.innerText = "0"
            scorePOne.classList.add("game-option--score")

            const scorePTwo = document.createElement("p")
            scorePTwo.innerText = "80"
            scorePTwo.classList.add("game-option--score")

            gameOption.append(gameOptionName,scorePOne,scorePTwo)

            gameOptions.appendChild(gameOption)
        })
        const scoreBoard = this.createScoreBoard()

        menu.appendChild(header)  
        menu.appendChild(gameOptions) 
        menu.appendChild(scoreBoard) 
        menu.appendChild(exitBtn)
        
        this._element.appendChild(menu)
    }

    createScoreBoard(){

        //implment scores recived from socket 
        const scoreBoard = document.createElement("div")
        scoreBoard.classList.add("score-board")
        const spacer = document.createElement("div")
        spacer.classList.add("spacer")
        spacer.innerText = " "

        const playerOneScore = document.createElement("p")
        playerOneScore.innerText = "0"
        playerOneScore.classList.add("sore-board--player-score")    
        
        const playerTwoScore = document.createElement("p")
        playerTwoScore.innerText = "10"
        playerTwoScore.classList.add("sore-board--player-score")    
        
        scoreBoard.append(spacer,playerOneScore,playerTwoScore)
        return scoreBoard
    }

    removeEveryElement(){
        if(this._element.firstChild){
            while(this._element.firstChild){
                this._element.removeChild(this._element.firstChild)
            }
        }
    }
    removeElement(){
        if(elem){
            while(elem.firstChild){
                elem.removeChild(elem.firstChild)
            }
        }
    }
}
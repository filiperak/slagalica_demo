import { capitalizeAfterSpaces } from "./util/helperFunctions.js"

export class GameUi{
    constructor(element,players,gameId,socket){
        this._element = element
        this._players = players
        this._gameId = gameId
        this._socket = socket
        this.reversePlayerIndex()
    }

    createGameMenu(){
        console.log(this._players);
        
        //add request to fetch game data
        this._socket.emit("requestPlayerData",this._gameId)
        this._socket.on("playersState",data => {
            
            const menu = document.createElement("div")
            menu.classList.add("game-menu")

            //header -- players names
            const header = document.createElement("header")
            header.classList.add("game-menu--header")

            this._players.forEach(elem => {
                let name = document.createElement("p")
                name.innerText = elem.name
                header.append(name)
            })

            //exit button -- leave game
            const exitBtn = document.createElement("div")
            exitBtn.classList.add("game-menu--exit-btn")
            exitBtn.innerText = "Leave"
            exitBtn.addEventListener("click",() => {
                this._socket.emit("leaveGame")
                this.removeEveryElement()
            })

            //game options
            const games = ["slagalica","moj broj","spojnice","skočko","ko zna zna","asocijacije"]
            // map out the games to the correct game key in object (socket package)
            const gameKeys = {
                "slagalica": "slagalica",
                "moj broj": "mojBroj",
                "spojnice": "spojnice",
                "skočko": "skocko",
                "ko zna zna": "koZnaZna",
                "asocijacije": "asocijacije"
            }

            const gameOptions = document.createElement("div")
            gameOptions.classList.add("game-options")

            games.forEach(game => {
                const gameKey = gameKeys[game]
                const gameOption = document.createElement("div")
                gameOption.classList.add("game-option")
    
                const gameOptionName = document.createElement("p")
                const gameClass = (g) => g.trim().replace(/\s+/g, '-')
                gameOptionName.classList.add(gameClass(game),"game-option--container")
                gameOptionName.innerText = capitalizeAfterSpaces(game)

                //add eventlistener to open game

                
                //promeni ovu u pravu datu iz socket paketa
                const playerIndex = data.players.findIndex(player => player.id === this._socket.id)
                if(playerIndex !== -1){
                    const player = data.players[playerIndex]
                    if(player.score.games[gameKey].opend){
                        gameOptionName.classList.add("game-opened")
                    }else{
                        const handleOpenGameClick = () => {
                            //this._element.appendChild(this.createGameContainer(game))
                            this._socket.emit("opendGame",{
                                gameId:this._gameId,
                                gameKey,
                                playerId:this._socket.id
                            })       
                            this._socket.on("gameData",data => {
                                this._element.appendChild(this.createGameContainer(game,data))
                                console.log(data);
                            })                     
                        }
                        gameOptionName.addEventListener("click",handleOpenGameClick)
                    }
                }
                gameOption.append(gameOptionName)
                this._players.forEach(p => {
                    const gameOptionScore = document.createElement("p")
                    gameOptionScore.classList.add("game-option--score")
                    gameOptionScore.innerText = p.score.games[gameKey].score
                    gameOption.append(gameOptionScore)   
                })
                gameOptions.appendChild(gameOption)
            })
            const scoreBoard = this.createScoreBoard()
    
            menu.appendChild(header)  
            menu.appendChild(gameOptions) 
            menu.appendChild(scoreBoard) 
            menu.appendChild(exitBtn)
            
            this._element.appendChild(menu)
        })

    }

    createScoreBoard(){

        //implment scores recived from socket 
        const scoreBoard = document.createElement("div")
        scoreBoard.classList.add("score-board")
        const spacer = document.createElement("div")
        spacer.classList.add("spacer")
        scoreBoard.append(spacer)

        this._players.forEach(p => {
            const playerScore = document.createElement("p")
            playerScore.innerText = p.score.total
            playerScore.classList.add("sore-board--player-score")    
            scoreBoard.appendChild(playerScore)
        })   
        return scoreBoard
    }

    createGameContainer(game,data){

        const gameContainer = document.createElement("div")
        gameContainer.classList.add("game-container")

        const gameContainerHeader = document.createElement("header")
        const backButton = document.createElement("div")
        backButton.classList.add("game-container--back-btn")
        backButton.innerText = "\u2190 Back"
        gameContainerHeader.appendChild(backButton)

        const header = document.createElement("h1")

        header.innerText = capitalizeAfterSpaces(game)


        gameContainer.append(gameContainerHeader,header)

        backButton.addEventListener("click",() => {
            this.removeEveryElement()
            this.createGameMenu()
        })

        switch(game){
            case "slagalica":
                this.slagalica(data,gameContainer)
                break
            case "moj broj":
                this.mojBroj()
                break
            case "spojnice":
                this.spojnice()
                break
            case "skocko":
                this.skocko()
                break
            case "ko zna zna":
                this.koZnaZna()
                break
            case "asocijacije":
                this.asocijacije()
                break
            default:
                console.log("game not found")
        }

        return gameContainer
    }
    slagalica(data,parent){

        const inputWord = []
        const letters = ["A","B","C","Č","Ć","D","Dž","Đ","E","F","G","H","I","J","K","L","Lj","M","N","Nj","O","P","R","S","Š","T","U","V","Z","Ž"]

        const slagalicaContainer = document.createElement("div")
        slagalicaContainer.classList.add("slagalica-container")

        const slagalicaInput = document.createElement("div")
        slagalicaInput.classList.add("slagalica-container--input")

        const slagalicaInputContainer = document.createElement("div")
        slagalicaInputContainer.classList.add("slagalica-container--input-container")

        const clearBtn = document.createElement("div")
        clearBtn.classList.add("slagalica-container--clear-btn")
        clearBtn.innerText = "Obriši"
        slagalicaInputContainer.appendChild(clearBtn)

        const slagalicaInputLine = document.createElement("div")
        slagalicaInputLine.classList.add("slagalica-container--input-line")
        slagalicaInput.append(slagalicaInputContainer,slagalicaInputLine)
        //slagalicaContainer.appendChild(slagalicaInput)  



        const checkWordBtn = document.createElement("div")
        checkWordBtn.classList.add("slagalica-container--check-btn")
        checkWordBtn.innerText = "Proveri Reč"

        const submitWordBtn = document.createElement("div")
        submitWordBtn.classList.add("slagalica-container--submit-btn")
        submitWordBtn.innerText = "Potvrdi"

        const renderInputLetters = () => {
            slagalicaInputContainer.innerHTML = ""
            slagalicaInputContainer.appendChild(clearBtn);
            inputWord.forEach(elem => {
                const letter = document.createElement("p")
                letter.classList.add("slagalica--letter--small") //change class name for beter style
                letter.innerText = elem
                slagalicaInputContainer.appendChild(letter)
            })
        }

        const slagalicaLetters = document.createElement("div")
        slagalicaLetters.classList.add("slagalica-container--letters")

        const intervals = [];

        for(let i =  0; i < 12; i++){
            const letter = document.createElement("p")
            letter.classList.add("slagalica--letter")
            const interval = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * letters.length)
                letter.innerText = letters[randomIndex]
            },100)
            intervals.push(interval);
            slagalicaLetters.appendChild(letter)    
        }

        const createLetters = () => {
            data.letterComb.forEach(elem => {
                const letter = document.createElement("p")
                letter.classList.add("slagalica--letter")
                letter.innerText = elem
    
                letter.addEventListener("click",() => {
                    inputWord.push(elem)
                    letter.classList.add("visibility-hidden")
                    renderInputLetters()
                })
    
                slagalicaLetters.appendChild(letter)
            })
    
            slagalicaContainer.appendChild(slagalicaLetters)
        }

        const slagalicaStopBtn = document.createElement("div")
        slagalicaStopBtn.classList.add("slagalica-container--stop-btn")
        slagalicaStopBtn.innerText = "Stop"
        slagalicaStopBtn.addEventListener("click",() => {
            intervals.forEach(interval => clearInterval(interval));
            this.removeElement(slagalicaLetters)
            slagalicaContainer.removeChild(slagalicaStopBtn)
            createLetters();
            // slagalicaInputContainer.appendChild(clearBtn)
            slagalicaContainer.append(checkWordBtn,submitWordBtn)
        })

        slagalicaContainer.append(slagalicaInput,slagalicaLetters,slagalicaStopBtn)

        checkWordBtn.addEventListener("click",() => {
            this.drawPoopup("test1312",() => {})
        })

        parent.appendChild(slagalicaContainer)
    }
    mojBroj(){

    }
    spojnice(){

    }
    skocko(){

    }
    koZnaZna(){

    }
    asocijacije(){

    }


    removeEveryElement(){
        if(this._element.firstChild){
            while(this._element.firstChild){
                this._element.removeChild(this._element.firstChild)
            }
        }
    }
    removeElement(elem){
        if(elem){
            while(elem.firstChild){
                elem.removeChild(elem.firstChild)
            }
        }
    }
    reversePlayerIndex() {
        const currentPlayerIndex = this._players.findIndex(player => player.id === this._socket.id);
        if (currentPlayerIndex !== -1) {
            const [currentPlayer] = this._players.splice(currentPlayerIndex, 1);
            this._players.unshift(currentPlayer);
        }
    }
    drawPoopup(text,callback){
        const popup = document.createElement("div")
        popup.classList.add("popup-container")

        const popupMessage = document.createElement("div")
        popupMessage.classList.add("popup-container--message")

        const popupText = document.createElement("p")
        popupMessage.innerText = text

        const popupBtn = document.createElement("div")
        popupBtn.classList.add("popup-container--btn")
        popupBtn.innerText = "OK"

        popupBtn.addEventListener("click",() => {
            callback()
            this._element.removeChild(popup)
        })

        popupMessage.append(popupText,popupBtn)
        popup.appendChild(popupMessage)
        this._element.appendChild(popup)
    }
}
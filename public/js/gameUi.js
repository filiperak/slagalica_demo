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
            //alert("aaaaa")
            this._socket.emit("leaveGame")
            this.removeEveryElement()
        })
        
        menu.append(header,exitBtn)
        
        this._element.appendChild(menu)
    }

    // exitBtn(){
    //     const exitBtn = document.createElement("div")
    //     exitBtn.classList.add("game-menu--exit-btn")
    //     exitBtn.addEventListener("click",() => {
    //         socket.emit("leaveGame")
    //         this.removeEveryElement()
    //     })
    // }

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
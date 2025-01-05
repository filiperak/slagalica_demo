export class GameUi{
    constructor(element,players,gameId){
        this._element = element
        this._players = players
        this._gameId = gameId
    }
    createGameMenu(){
        const menu = document.createElement("div")
        // this._players.forEach(elem => {
        //     let name = document.createElement("p")
        //     name.innerText = elem.name
        //     menu.append(name)
        // })
        // const gameName = document.createElement("div")
        // gameName.innerText = this._gameId
        // menu.appendChild(gameName) 

        menu.classList.add("game-menu")
        const header = document.createElement("header")
        header.classList.add("game-menu--header")
        this._players.forEach(elem => {
            let name = document.createElement("p")
            name.innerText = elem.name
            header.append(name)
        })
        menu.append(header)

        this._element.appendChild(menu)
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
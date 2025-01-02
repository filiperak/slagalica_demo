export class GameUi{
    constructor(element,players,gameId){
        this._element = element
        this._players = players
        this._gameId = gameId
    }
    createInfoTab(){
        const infoTab = document.createElement("div")
        this._players.forEach(elem => {
            let name = document.createElement("p")
            name.innerText = elem.name
            infoTab.append(name)
        })
        const gameName = document.createElement("div")
        gameName.innerText = this._gameId
        infoTab.appendChild(gameName) 
        this._element.appendChild(infoTab)
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

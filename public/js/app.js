import { Ui } from "./ui.js"
import { createGameId } from "./util/createGameId.js"

const socket = io("ws://localhost:3500")

const createGame = document.querySelector("#createGame")
const gameId = document.querySelector("#gameId")
const joinGame = document.querySelector("#joinGame")
const randomGame = document.querySelector("#randomGame")
const gameContainer = document.querySelector("#gameContainer")
const usernameInp = document.querySelector(".username-inp")

let gameUi

createGame.addEventListener("click",() => {
    let gid = createGameId()
    gameId.value = gid
})

joinGame.addEventListener("click",() => {
    if(usernameInp.value && gameId.value) {
        console.log(usernameInp.value);
        
        socket.emit("enterRoom",{
            name:usernameInp.value,
            game: gameId.value
        })
    }
})

socket.on("notification",(data) => {
    alert(data.text)
})

socket.on("startGame",({game,playersInGame}) => {
    console.log(game,playersInGame);
    
    gameUi = new Ui(gameContainer,playersInGame,game)

    gameUi.createInfoTab()
})

socket.on("disconnect",() => {
    gameUi.removeGameElement()
})
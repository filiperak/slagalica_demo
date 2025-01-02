import { GameUi } from "./gameUi.js"
import { createGameId } from "./util/createGameId.js"
import { setUsername } from "./util/username.js"

const socket = io("ws://localhost:3500")

const createGame = document.querySelector("#createGame")
const gameId = document.querySelector("#gameId")
const joinGame = document.querySelector("#joinGame")
const randomGame = document.querySelector("#randomGame")
const gameContainer = document.querySelector("#gameContainer")
const usernameInp = document.querySelector(".username-inp")
const popup = document.querySelector(".popup-container")

setUsername(usernameInp)


let gameUi

createGame.addEventListener("click",() => {
    let gid = createGameId()
    gameId.value = gid
})

joinGame.addEventListener("click",() => {
    if(usernameInp.value) {
        const game = gameId.value? gameId.value:null   

        socket.emit("enterRoom",{
            name:usernameInp.value,
            game: game
        })
    }
})

//join random game
// randomGame.addEventListener("click",() => {
//     if(usernameInp.value){
//         socket.emit("joinRandomGame",{name:usernameInp.value})
//     }
// })


// move the socket functions to a seperate folder


socket.on("notification",(data) => {
    alert(data.text)
})

socket.on("startGame",({game,playersInGame}) => {
    console.log(game,playersInGame);
    
    gameUi = new GameUi(gameContainer,playersInGame,game)

    gameUi.createInfoTab()
})

socket.on("disconnect",() => {
    gameUi.removeEveryElement()
})

socket.on("opponentLeft",() => {
    gameUi.removeEveryElement()
})

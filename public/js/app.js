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
    
    gameUi = new Ui(gameContainer,playersInGame,game)

    gameUi.createInfoTab()
})

// socket.on("disconnect",() => {
//     gameUi.removeEveryElement()
// })

// socket.on("opponentLeft",() => {
//     gameUi.removeEveryElement()
// })

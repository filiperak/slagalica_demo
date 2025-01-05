import { GameUi } from "./gameUi.js"
import { createGameId } from "./util/createGameId.js"
import { setUsername, toggleModel } from "./util/helperFunctions.js"

const socket = io("ws://localhost:3500")

const createGame = document.querySelector("#createGame")
const gameId = document.querySelector("#gameId")
const joinGame = document.querySelector("#joinGame")
const randomGame = document.querySelector("#randomGame")
const gameContainer = document.querySelector("#gameContainer")
const usernameInp = document.querySelector(".username-inp")
const popup = document.querySelector(".popup-container")
const cancleModel = document.querySelector(".loading-model-cancle")
const loadingModal = document.querySelector(".loading-model")

let gameUi

setUsername(usernameInp)
cancleModel.addEventListener("click",() => {
    socket.emit("leaveGame")
    toggleModel(loadingModal)
})


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
        toggleModel(loadingModal)
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
    toggleModel(loadingModal)
    gameUi.createGameMenu()
})

socket.on("disconnect",() => {
    gameUi.removeEveryElement()
})

socket.on("opponentLeft",() => {
    gameUi.removeEveryElement()
})

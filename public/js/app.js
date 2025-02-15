import { GameUi } from "./gameUi.js"
import { createGameId } from "./util/createGameId.js"
import { setUsername, toggleModel } from "./util/helperFunctions.js"

 const socket = io("ws://localhost:3500")

const createGame = document.querySelector("#createGame")
const gameId = document.querySelector("#gameId")
const joinGame = document.querySelector("#joinGame")
const singlePlayer = document.querySelector("#singlePlayer")
const randomGame = document.querySelector("#randomGame")
const gameContainer = document.querySelector("#gameContainer")
const usernameInp = document.querySelector(".username-inp")
const popup = document.querySelector(".popup-container")
const cancleModel = document.querySelector(".loading-model-cancle")
const loadingModal = document.querySelector(".loading-model")

let gameUi
let gameui2

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
singlePlayer.addEventListener("click",() => {
    if(usernameInp.value) {
        const game = createGameId()
        console.log(game);
        

        socket.emit("enterSinglePlayer",{
            name:usernameInp.value
        })
        toggleModel(loadingModal)
    }
})

socket.on("startSinglePlayerGame", ({ game }) => {
    console.log("Received startSinglePlayerGame event");
    console.log("Game object:", game);

    gameui2 = new GameUi(gameContainer, game, socket);
    toggleModel(loadingModal);
    gameui2.createGameMenu();

    console.log("GameUi instance:", gameui2);
    console.log("Game object after instantiation:", game);
});

socket.on("notification",(data) => {
    //alert(data.text)
})

socket.on("startGame",({game}) => {
    
    gameUi = new GameUi(gameContainer,game,socket)
    toggleModel(loadingModal)
    gameUi.createGameMenu()
    console.log(game);
    
    //gameUi.createGames()
})

socket.on("disconnect",() => {
    gameUi.removeEveryElement()
})

socket.on("opponentLeft",() => {
    // gameUi.removeEveryElement()
})
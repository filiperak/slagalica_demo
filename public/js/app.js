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

function handleGameJoin(mode) {
    if (usernameInp.value) {
        const game = mode === "single" ? createGameId() : gameId.value || null;

        socket.emit(mode === "single" ? "enterSinglePlayer" : "enterRoom", {
            name: usernameInp.value,
            game: mode === "single" ? undefined : game
        });

        toggleModel(loadingModal);
    } else {
        usernameInp.classList.add("missing-username-input");
        usernameInp.placeholder = "PLEASE PROVIDE A USERNAME";
    }
}

// Event listeners
joinGame.addEventListener("click", () => handleGameJoin("multi"));
randomGame.addEventListener("click", () => handleGameJoin("multi"));
singlePlayer.addEventListener("click", () => handleGameJoin("single"));

usernameInp.addEventListener("input", () => {
    usernameInp.classList.remove("missing-username-input");
    usernameInp.placeholder = "Enter username";
});


socket.on("startSinglePlayerGame", ({ game }) => {

    gameui2 = new GameUi(gameContainer, game, socket);
    toggleModel(loadingModal);
    gameui2.createGameMenu();

});

socket.on("notification",(data) => {
    //alert(data.text)
})

socket.on("startGame",({game}) => {
    
    gameUi = new GameUi(gameContainer,game,socket)
    toggleModel(loadingModal)
    gameUi.createGameMenu()
    
    //gameUi.createGames()
})

socket.on("disconnect",() => {
    gameUi.removeEveryElement()
})

socket.on("opponentLeft",() => {
    // gameUi.removeEveryElement()
})
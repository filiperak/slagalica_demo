import { createGameId } from "./util/createGameId.js"

const socket = io("ws://localhost:3500")

const createGame = document.querySelector("#createGame")
const gameId = document.querySelector("#gameId")
const joinGame = document.querySelector("#joinGame")
const randomGame = document.querySelector("#randomGame")
const username = document.querySelector("#username")

const usernameInp = document.querySelector(".username-inp")

usernameInp.addEventListener("input",(e) => {
    username.innerText = e.target.value !== ""? e.target.value : "Guest"
})

createGame.addEventListener("click",() => {
    let gid = createGameId()
    gameId.value = gid
})

joinGame.addEventListener("click",() => {
    if(username.value && gameId.value) {
        socket.emit("enterRoom",{
            user:username.value,
            game: gameId.value
        })
    }
})
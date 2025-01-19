import { capitalizeAfterSpaces } from "./util/helperFunctions.js"

export class GameUi {
    constructor(element, players, gameId, socket) {
        this._element = element;
        this._players = players;
        this._gameId = gameId;
        this._socket = socket;
        this.reversePlayerIndex(); // Ensure players are reversed initially
    }

    get players() {
        return this._players;
    }

    set players(players) {
        this._players = players;
        this.reversePlayerIndex();
        this.removeEveryElement();
    }

    reversePlayerIndex() {
        const currentPlayerIndex = this._players.findIndex(player => player.id === this._socket.id);
        if (currentPlayerIndex !== -1) {
            // Move the current player to the first position
            const [currentPlayer] = this._players.splice(currentPlayerIndex, 1);
            this._players.unshift(currentPlayer);
        }
    }

    createGameMenu() {
        // Emit an event to request the game state from the server
        this._socket.emit("requestGameData", this._gameId);

        // Listen for the response from the server
        this._socket.on("gameState", (data) => {
            // Set the players and reverse their indexes if necessary
            this.players = data.players;

            // Create the game menu
            const menu = document.createElement("div");
            menu.classList.add("game-menu");

            const header = document.createElement("header");
            header.classList.add("game-menu--header");
            this._players.forEach(elem => {
                let name = document.createElement("p");
                name.innerText = elem.name;
                header.append(name);
            });

            const exitBtn = document.createElement("div");
            exitBtn.classList.add("game-menu--exit-btn");
            exitBtn.innerText = "Leave";
            exitBtn.addEventListener("click", () => {
                this._socket.emit("leaveGame");
                this.removeEveryElement();
            });

            const games = ["slagalica", "moj broj", "spojnice", "skočko", "ko zna zna", "asocijacije"];
            const gameKeys = {
                "slagalica": "slagalica",
                "moj broj": "mojBroj",
                "spojnice": "spojnice",
                "skočko": "skocko",
                "ko zna zna": "koZnaZna",
                "asocijacije": "asocijacije"
            };

            const gameOptions = document.createElement("div");
            gameOptions.classList.add("game-options");
            games.forEach(game => {
                const gameKey = gameKeys[game]; // Get the corresponding key from the mapping
                const gameOption = document.createElement("div");
                gameOption.classList.add("game-option");

                const gameOptionName = document.createElement("p");
                const gameClass = (g) => g.trim().replace(/\s+/g, '-');
                gameOptionName.classList.add(gameClass(game), "game-option--container");
                gameOptionName.innerText = capitalizeAfterSpaces(game);

                // Identify the player using the socket.id
                const playerIndex = this._players.findIndex(player => player.id === this._socket.id);
                if (playerIndex !== -1) {
                    const player = this._players[playerIndex];
                    if (player.score.games[gameKey].opend) {
                        gameOptionName.classList.add("opend");
                    } else {
                        const handleOpenGameClick = () => {
                            this._element.appendChild(this.createGameContainer(game, data));
                            this._socket.emit("opendGame", {
                                gameId: this._gameId,
                                gameKey: gameKey,
                                playerId: this._socket.id
                            });
                            console.log(this._gameId, gameKey, this._socket.id);
                        };
                        gameOptionName.addEventListener("click", handleOpenGameClick);
                    }
                }

                const scorePOne = document.createElement("p");
                scorePOne.innerText = this._players[0].score.games[gameKey].score;
                scorePOne.classList.add("game-option--score");

                const scorePTwo = document.createElement("p");
                scorePTwo.innerText = this._players[1].score.games[gameKey].score;
                scorePTwo.classList.add("game-option--score");

                gameOption.append(gameOptionName, scorePOne, scorePTwo);

                gameOptions.appendChild(gameOption);
            });

            const scoreBoard = this.createScoreBoard();

            menu.appendChild(header);
            menu.appendChild(gameOptions);
            menu.appendChild(scoreBoard);
            menu.appendChild(exitBtn);

            this._element.appendChild(menu);
        });
    }

    createGameContainer(game, data) {
        const gameContainer = document.createElement("div");
        gameContainer.classList.add("game-container");

        const gameContainerHeader = document.createElement("header");
        const backButton = document.createElement("div");
        backButton.classList.add("game-container--back-btn");
        backButton.innerText = "\u2190 Back";
        gameContainerHeader.appendChild(backButton);

        const header = document.createElement("h1");
        header.innerText = capitalizeAfterSpaces(game);
        gameContainerHeader.appendChild(header);

        gameContainer.appendChild(gameContainerHeader);

        backButton.addEventListener("click", () => {
            this.removeEveryElement();
            this.createGameMenu();
        });

        switch (game) {
            case "slagalica":
                this.slagalica(data, gameContainer);
                break;
            case "moj broj":
                this.mojBroj();
                break;
            case "spojnice":
                this.spojnice();
                break;
            case "skocko":
                this.skocko();
                break;
            case "ko zna zna":
                this.koZnaZna();
                break;
            case "asocijacije":
                this.asocijacije();
                break;
            default:
                console.log("game not found");
        }

        return gameContainer;
    }

    slagalica(data, parent) {
        const inputWord = [];
        const letters = ["A", "B", "C", "Č", "Ć", "D", "Dž", "Đ", "E", "F", "G", "H", "I", "J", "K", "L", "Lj", "M", "N", "Nj", "O", "P", "R", "S", "Š", "T", "U", "V", "Z", "Ž"];

        const slagalicaContainer = document.createElement("div");
        slagalicaContainer.classList.add("slagalica-container");

        const slagalicaInput = document.createElement("div");
        slagalicaInput.classList.add("slagalica-container--input");

        const slagalicaInputContainer = document.createElement("div");
        slagalicaInputContainer.classList.add("slagalica-container--input-container");

        const clearBtn = document.createElement("div");
        clearBtn.classList.add("slagalica-container--clear-btn");
        clearBtn.innerText = "Obriši";
        clearBtn.addEventListener("click", () => {
            if (inputWord.length > 0) {
                const lastLetterId = inputWord[inputWord.length - 1].id;
                const lastLetter = document.getElementById(lastLetterId);
                if (lastLetter) {
                    lastLetter.classList.remove("visibility-hidden");
                }
                inputWord.pop();
                renderInputLetters();
            }
        });

        slagalicaInputContainer.appendChild(clearBtn);

        document.addEventListener("keydown", (e) => {
            console.log(`Key: ${e.key}, Code: ${e.code}`);
            if (e.key === "Backspace") {
                deleteLastLetter();
            }
        });

        const slagalicaInputLine = document.createElement("div");
        slagalicaInputLine.classList.add("slagalica-container--input-line");
        slagalicaInput.append(slagalicaInputContainer, slagalicaInputLine);

        const slagalicaLetters = document.createElement("div");
        slagalicaLetters.classList.add("slagalica-container--letters");

        // Array to store interval IDs
        const intervals = [];

        // Create spinning letters
        for (let i = 0; i < 12; i++) {
            const letter = document.createElement("p");
            letter.classList.add("slagalica--letter");
            const interval = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * letters.length);
                letter.innerText = letters[randomIndex];
            }, 100);
            intervals.push(interval); // Store the interval ID
            slagalicaLetters.appendChild(letter);
        }

        // Function to render the actual letters
        const createLetters = () => {
            // Clear the existing letters
            slagalicaLetters.innerHTML = "";
            // Render the actual letters
            data.letterComb.forEach((elem, ind) => {
                const letter = document.createElement("p");
                letter.classList.add("slagalica--letter");
                const letterId = `letter-${ind}`;
                letter.setAttribute("id", letterId);
                letter.innerText = elem;

                letter.addEventListener("click", () => {
                    inputWord.push({ letter: elem, id: letterId });
                    letter.classList.add("visibility-hidden");
                    renderInputLetters();
                });

                slagalicaLetters.appendChild(letter);
            });

            slagalicaContainer.appendChild(slagalicaLetters);
        };

        // Function to render the input letters
        const renderInputLetters = () => {
            slagalicaInputContainer.innerHTML = "";
            slagalicaInputContainer.appendChild(clearBtn); // Re-append the clear button
            inputWord.forEach((elem) => {
                const letter = document.createElement("p");
                letter.classList.add("slagalica--letter--small");
                letter.innerText = elem.letter;
                slagalicaInputContainer.appendChild(letter);
            });
        };

        const checkWordBtn = document.createElement("div");
        checkWordBtn.classList.add("slagalica-container--check-btn");
        checkWordBtn.innerText = "Proveri Reč";

        const submitWordBtn = document.createElement("div");
        submitWordBtn.classList.add("slagalica-container--submit-btn");
        submitWordBtn.innerText = "Potvrdi";

        const slagalicaStopBtn = document.createElement("div");
        slagalicaStopBtn.classList.add("slagalica-container--stop-btn");
        slagalicaStopBtn.innerText = "Stop";
        slagalicaStopBtn.addEventListener("click", () => {
            intervals.forEach(interval => clearInterval(interval));
            this.removeElement(slagalicaLetters);
            slagalicaContainer.removeChild(slagalicaStopBtn);
            createLetters();
            slagalicaContainer.append(checkWordBtn, submitWordBtn);
        });

        slagalicaContainer.append(slagalicaInput, slagalicaLetters, slagalicaStopBtn);
        parent.appendChild(slagalicaContainer);
    }

    mojBroj() {
        // Implement the mojBroj game UI
    }

    spojnice() {
        // Implement the spojnice game UI
    }

    skocko() {
        // Implement the skocko game UI
    }

    koZnaZna() {
        // Implement the koZnaZna game UI
    }

    asocijacije() {
        // Implement the asocijacije game UI
    }

    removeEveryElement() {
        if (this._element.firstChild) {
            while (this._element.firstChild) {
                this._element.removeChild(this._element.firstChild);
            }
        }
    }

    removeElement(elem) {
        if (elem) {
            while (elem.firstChild) {
                elem.removeChild(elem.firstChild);
            }
        }
    }

    createScoreBoard() {
        // Implement scores received from socket
        const scoreBoard = document.createElement("div");
        scoreBoard.classList.add("score-board");
        const spacer = document.createElement("div");
        spacer.classList.add("spacer");
        scoreBoard.append(spacer);

        this._players.forEach(p => {
            const playerScore = document.createElement("p");
            playerScore.innerText = p.score.total;
            playerScore.classList.add("score-board--player-score");
            scoreBoard.appendChild(playerScore);
        });
        return scoreBoard;
    }
}
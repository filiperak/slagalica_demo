import {
  capitalizeAfterSpaces,
  removeAllEventListeners,
  validateAddition,
} from "./util/helperFunctions.js";
import { keyCodeToLetterMap, numberToLetterMap } from "./util/keyCodes.js";
import {
  BLUE_BUTTON_BACKGROUND,
  GREEN_BUTTON_BACKGROUND,
  RED_BUTTON_BACKGROUND,
  YELLOW_BUTTON_BACKGROUND,
} from "./util/styleConstants.js";

export class GameUi {
  // constructor(element, players, gameId, socket) {
  constructor(element, game, socket) {
    this._element = element;
    this._players = game.players;
    this._gameId = game.gameId;
    this._gameState = game.gameState;
    this._socket = socket;
    this.reversePlayerIndex();
    this._imgPaths = [
      "../../assets/tref.png",
      "../../assets/owl_logo.png",
      "../../assets/caro.png",
      "../../assets/spades.png",
      "../../assets/herz.png",
      "../../assets/star.png",
    ];
  }

  createGameMenu() {
    //remove socket evetnt to prevent multyple events ocureing at the same time
    this._socket.off("playersState");
    this._socket.off("gameData");
    this._socket.off("scoreSubmited");
    this._socket.off("scoreSubmitedSkocko");
    this._socket.off("scoreSubmitedKoznazna");
    this._socket.off("scoreSubmitedAsocijacije");

    //add request to fetch game data
    this._socket.emit("requestPlayerData", this._gameId);
    this._socket.on("playersState", (data) => {
      this._players = data.players;
      this.reversePlayerIndex();

      const menu = document.createElement("div");
      menu.classList.add("game-menu");

      //header -- players names
      const header = document.createElement("header");
      header.classList.add("game-menu--header");

      this._players.forEach((elem) => {
        let name = document.createElement("p");
        name.innerText = elem.name;
        header.append(name);
      });

      //exit button -- leave game
      const exitBtn = document.createElement("div");
      exitBtn.classList.add("game-menu--exit-btn");
      exitBtn.innerText = "Napusti igru";
      exitBtn.addEventListener("click", () => {
        this._socket.emit("leaveGame");
        this.removeEveryElement();
      });

      //game options
      const games = [
        "slagalica",
        "moj broj",
        "spojnice",
        "skočko",
        "ko zna zna",
        "asocijacije",
      ];
      // map out the games to the correct game key in object (socket package)
      const gameKeys = {
        slagalica: "slagalica",
        "moj broj": "mojBroj",
        spojnice: "spojnice",
        skočko: "skocko",
        "ko zna zna": "koZnaZna",
        asocijacije: "asocijacije",
      };

      const gameOptions = document.createElement("div");
      gameOptions.classList.add("game-options");

      games.forEach((game) => {
        const gameKey = gameKeys[game];
        const gameOption = document.createElement("div");
        gameOption.classList.add("game-option");

        const gameOptionName = document.createElement("p");
        const gameClass = (g) => g.trim().replace(/\s+/g, "-");
        gameOptionName.classList.add(gameClass(game), "game-option--container");
        gameOptionName.innerText = capitalizeAfterSpaces(game);

        //add eventlistener to open game

        //promeni ovu u pravu datu iz socket paketa
        const playerIndex = this._players.findIndex(
          (player) => player.id === this._socket.id
        );
        if (playerIndex !== -1) {
          const player = this._players[playerIndex];
          if (player.score.games[gameKey].opend) {
            gameOptionName.classList.add("game-opened");
          } else {
            const handleOpenGameClick = () => {
              //this._element.appendChild(this.createGameContainer(game))
              this._socket.emit("opendGame", {
                gameId: this._gameId,
                gameKey,
                playerId: this._socket.id,
              });
              this._socket.on("gameData", (data) => {
                this._element.appendChild(this.createGameContainer(game, data));
                console.log(data, "OVDEEE");
              });
            };
            gameOptionName.addEventListener("click", handleOpenGameClick);
          }
        }
        gameOption.append(gameOptionName);
        this._players.forEach((p) => {
          const gameOptionScore = document.createElement("p");
          gameOptionScore.classList.add("game-option--score");
          gameOptionScore.innerText = p.score.games[gameKey].score;
          gameOption.append(gameOptionScore);
        });
        gameOptions.appendChild(gameOption);
      });
      const scoreBoard = this.createScoreBoard();

      menu.appendChild(header);
      menu.appendChild(gameOptions);
      menu.appendChild(scoreBoard);
      menu.appendChild(exitBtn);

      this._element.appendChild(menu);
    });
    // const popupMessageDefault = (t) => {
    //   let text;
    //   console.log(t);
    //   if (t) {
    //     t.data > 0
    //       ? (text = `🥳Osvojili ste ${t.data} poena🥳`)
    //       : (text = `🤡Osvojili ste ${t.data} poena🤡`);
    //   } else {
    //     text = `🤡Osvojili ste 0 poena🤡`;
    //   }
    //   this.drawPopup(text, () => {});
    // };

    // const popupMessageSlagalica = (t) => {
    //   // const text = `Osvojili ste ${t.data} poena`;
    //   let text;
    //   t.data > 0
    //     ? (text = `🥳Osvojili ste ${t.data} poena🥳`)
    //     : (text = `🤡Osvojili ste ${t.data} poena🤡`);
    //   this.drawPopup(text, (m) => {
    //     const p1 = document.createElement("p");
    //     p1.innerText = "Naša reč:";

    //     const p2 = document.createElement("p");
    //     p2.innerText = this._gameState.slagalica.word;
    //     p2.style.fontWeight = 600;
    //     p2.style.fontSize = "1.1rem";

    //     m.append(p1, p2);
    //   });
    // };

    // const popupMessageSkocko = (t) => {
    //   const text = `Osvojili ste ${t.data} poena`;
    //   this.drawPopup(text, (popupMessageSkocko) => {
    //     const combination = document.createElement("div");
    //     combination.classList.add("popup-combination-skocko");

    //     const p = document.createElement("p");
    //     p.innerText = "Tačna kombinacija:";

    //     const skockoCombination = document.createElement("section");

    //     this._gameState.skocko.forEach((e, ind) => {
    //       const c = document.createElement("div");
    //       c.classList.add("popup-combination-skocko--card");

    //       const img = document.createElement("img");
    //       img.setAttribute("src", this._imgPaths[e]);

    //       c.appendChild(img);
    //       skockoCombination.appendChild(c);
    //     });
    //     combination.append(p, skockoCombination);
    //     popupMessageSkocko.appendChild(combination);
    //   });
    // };
    // this._socket.once("scoreSubmitedSlagalica",  popupMessage);
    // this._socket.once("scoreSubmitedSkocko", popupMessage);
    // if (!this._socket.hasListeners("scoreSubmitedSlagalica")) {
    //   this._socket.on("scoreSubmitedSlagalica", popupMessageSlagalica);
    // }
    if (!this._socket.hasListeners("scoreSubmitedSkocko")) {
      this._socket.on("scoreSubmitedSkocko", this.popupMessageSkocko);
    }
    // this._socket.on("scoreSubmitedSkocko", (score) => {
    //   const text = `Osvojili ste ${score.data} poena`;
    //   this.drawPopup(text, () => {
    //     console.log(" created");
    //   });
    // });
    if (!this._socket.hasListeners("scoreSubmitedSpojnice")) {
      this._socket.on("scoreSubmitedSpojnice", this.popupMessageDefault);
    }
    // if (!this._socket.hasListeners("scoreSubmitedKoznazna")) {
    //   this._socket.on("scoreSubmitedKoznazna", this.popupMessageDefault);
    // }
    // if (!this._socket.hasListeners("scoreSubmitedAsocijacije")) {
    //   this._socket.on("scoreSubmitedAsocijacije", popupMessageDefault);
    // }
  }

  createScoreBoard() {
    //implment scores recived from socket
    const scoreBoard = document.createElement("div");
    scoreBoard.classList.add("score-board");
    const spacer = document.createElement("div");
    spacer.classList.add("spacer");
    scoreBoard.append(spacer);

    this._players.forEach((p) => {
      const playerScore = document.createElement("p");
      playerScore.innerText = p.score.total;
      playerScore.classList.add("sore-board--player-score");
      scoreBoard.appendChild(playerScore);
    });
    return scoreBoard;
  }

  createGameContainer(game, data) {
    const gameContainer = document.createElement("div");
    gameContainer.classList.add("game-container");

    const gameContainerHeader = document.createElement("header");

    const backButton = document.createElement("div");
    backButton.classList.add("game-container--back-btn");
    backButton.innerText = "\u2190 Back";
    backButton.addEventListener("click", () => {
      clearInterval(timerInterval);
      this.removeEveryElement();
      this.createGameMenu();
    });

    //time functions
    let time = 90;
    const clock = document.createElement("div");
    clock.classList.add("game-container--clock");
    clock.innerHTML = `<i class="fa-regular fa-clock fa-spin"></i><span>${time}</span>`;

    let gameEndCallback;

    const updateClock = () => {
      time -= 1;
      clock.querySelector("span").innerText = time;
      if (time < 16) {
        clock.innerHTML = "";
        clock.style.backgroundColor = "red";
        clock.innerHTML = `<i class="fa-regular fa-clock fa-beat-fade"></i><span>${time}</span>`;
      }
      if (time <= 0) {
        clock.innerHTML = `<i class="fa-regular fa-clock"></i><span>${time}</span>`;
        clearInterval(timerInterval);
        if (gameEndCallback) {
          gameEndCallback();
        }
      }
    };
    const timerInterval = setInterval(updateClock, 1000);

    gameContainerHeader.append(backButton, clock);
    ///////////////////////////////////////////

    const header = document.createElement("h1");
    header.innerText = capitalizeAfterSpaces(game);

    gameContainer.append(gameContainerHeader, header);

    switch (game) {
      case "slagalica":
        gameEndCallback = () =>
          this.slagalica(
            data,
            gameContainer,
            () => clearInterval(timerInterval),
            time
          );
        this.slagalica(
          data,
          gameContainer,
          () => clearInterval(timerInterval),
          time
        );
        break;
      case "moj broj":
        this.mojBroj(
          data,
          gameContainer,
          () => clearInterval(timerInterval),
          time
        );
        break;
      case "spojnice":
        gameEndCallback = () =>
          this.spojnice(
            data,
            gameContainer,
            () => clearInterval(timerInterval),
            time
          );
        this.spojnice(
          data,
          gameContainer,
          () => clearInterval(timerInterval),
          time
        );
        break;
      case "skočko":
        gameEndCallback = () =>
          this.skocko(
            data,
            gameContainer,
            () => clearInterval(timerInterval),
            time
          );
        this.skocko(
          data,
          gameContainer,
          () => clearInterval(timerInterval),
          time
        );
        break;
      case "ko zna zna":
        // gameEndCallback = () =>
        //   this.koZnaZna(
        //     data,
        //     gameContainer,
        //     () => clearInterval(timerInterval),
        //     time
        //   );
        this.koZnaZna(
          data,
          gameContainer,
          () => clearInterval(timerInterval),
          time
        );
        break;
      case "asocijacije":
        this.asocijacije(
          data,
          gameContainer,
          () => clearInterval(timerInterval),
          time
        );
        break;
      default:
        console.log("game not found");
    }

    return gameContainer;
  }
  slagalica(data, parent, stopTimer, time) {
    const inputWord = [];
    const letters = [
      "A",
      "B",
      "C",
      "Č",
      "Ć",
      "D",
      "Dž",
      "Đ",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "Lj",
      "M",
      "N",
      "Nj",
      "O",
      "P",
      "R",
      "S",
      "Š",
      "T",
      "U",
      "V",
      "Z",
      "Ž",
    ];
    const intervals = [];
    const letterOptions = [];

    const slagalicaContainer = document.createElement("div");
    slagalicaContainer.classList.add("slagalica-container");

    const slagalicaInput = document.createElement("div");
    slagalicaInput.classList.add("slagalica-container--input");

    const slagalicaInputContainer = document.createElement("div");
    slagalicaInputContainer.classList.add(
      "slagalica-container--input-container"
    );

    const clearBtn = document.createElement("div");
    clearBtn.classList.add("slagalica-container--clear-btn");
    clearBtn.innerHTML = '<i class="fa-solid fa-delete-left"></i>';
    clearBtn.innerText = "Obriši";

    const wordValidatorDiv = document.createElement("div");
    wordValidatorDiv.classList.add("slagalica-container--word-validator");

    const slagalicaInputLine = document.createElement("div");
    slagalicaInputLine.classList.add("slagalica-container--input-line");
    slagalicaInput.append(slagalicaInputContainer);

    if (time > 0) slagalicaInput.append(slagalicaInputLine);

    const checkWordBtn = document.createElement("div");
    checkWordBtn.classList.add("slagalica-container--check-btn");
    checkWordBtn.innerText = "Proveri Reč";

    const submitWordBtn = document.createElement("div");
    submitWordBtn.classList.add("slagalica-container--submit-btn");
    submitWordBtn.innerText = "Potvrdi";

    const slagalicaLetters = document.createElement("div");
    slagalicaLetters.classList.add("slagalica-container--letters");

    const slagalicaStopBtn = document.createElement("div");
    slagalicaStopBtn.classList.add("slagalica-container--stop-btn");
    slagalicaStopBtn.innerText = "Stop";

    if (time > 0) {
      for (let i = 0; i < 12; i++) {
        const letter = document.createElement("p");
        letter.classList.add("slagalica--letter");
        const interval = setInterval(() => {
          const randomIndex = Math.floor(Math.random() * letters.length);
          letter.innerText = letters[randomIndex];
        }, 100);
        intervals.push(interval);
        slagalicaLetters.appendChild(letter);
      }
    }

    const renderInputLetters = () => {
      slagalicaInputContainer.innerHTML = "";
      if (inputWord.length !== 0) {
        clearBtn.innerHTML = '<i class="fa-solid fa-delete-left"></i>';
        slagalicaInputContainer.appendChild(clearBtn);
      }
      inputWord.forEach((elem) => {
        const letter = document.createElement("p");
        letter.classList.add("slagalica--letter--small");
        letter.innerText = elem.letter;
        slagalicaInputContainer.appendChild(letter);
      });
    };

    const deleteLastLetter = () => {
      if (inputWord.length > 0) {
        wordValidatorDiv.innerText = "";
        const lastLetterId = inputWord[inputWord.length - 1].id;
        const lastLetter = document.getElementById(lastLetterId);
        if (lastLetter) {
          lastLetter.classList.remove("visibility-hidden");
        }
        inputWord.pop();
        renderInputLetters();
      }
    };

    const createLetters = () => {
      data.letterComb.forEach((elem, ind) => {
        const letter = document.createElement("p");
        letter.classList.add("slagalica--letter");
        const letterId = `letter-${ind}`;
        letter.setAttribute("id", letterId);
        letter.innerText = elem;
        letterOptions.push(elem);

        letter.addEventListener("click", () => {
          wordValidatorDiv.innerText = "";
          inputWord.push({ letter: elem, id: letterId });
          letter.classList.add("visibility-hidden");
          renderInputLetters();
        });

        slagalicaLetters.appendChild(letter);
      });

      slagalicaContainer.appendChild(slagalicaLetters);
    };

    const stopLetters = () => {
      intervals.forEach((interval) => clearInterval(interval));
      this.removeElement(slagalicaLetters);
      slagalicaContainer.removeChild(slagalicaStopBtn);
      createLetters();
      document.body.removeEventListener("keydown", stopLettersBody);
      slagalicaContainer.append(checkWordBtn, submitWordBtn);
    };

    const stopLettersBody = (e) => {
      if (e.keyCode == 32) {
        stopLetters();
        document.body.removeEventListener("keydown", stopLettersBody);
      }
    };

    const submitWord = () => {
      const word = inputWord.map((elem) => elem.letter).join("");
      this._socket.emit("sendSlagalicaScore", { gameId: this._gameId, word });
      stopTimer();
      removeAllEventListeners(slagalicaContainer);
      document.body.removeEventListener("keydown", handleKeyDown);
      document.body.removeEventListener("keyup", handleKeyUpLetter);
    };

    const handleKeyDown = (e) => {
      switch (e.keyCode) {
        case 8:
          deleteLastLetter();
          break;
        case 13:
          submitWord();
        default:
          break;
      }
    };

    const wordCheckResultHandler = (data) => {
      if (data) {
        if (data.validated) {
          wordValidatorDiv.innerText = "👋Reč je prihvaćena";
          wordValidatorDiv.style.color = "#00ff00";
        } else {
          wordValidatorDiv.innerText = "❌Reč nije prihvaćena";
          wordValidatorDiv.style.color = "red";
        }
      }
    };

    const handleKeyUpLetter = (e) => {
      const letter = keyCodeToLetterMap[e.keyCode];
      if (letter && data.letterComb.includes(letter)) {
        const letterElements = Array.from(
          document.querySelectorAll(`.slagalica--letter`)
        );
        const letterElement = letterElements.find(
          (el) =>
            el.innerText === letter &&
            !el.classList.contains("visibility-hidden")
        );
        if (letterElement) {
          const letterId = letterElement.getAttribute("id");
          wordValidatorDiv.innerText = "";
          inputWord.push({ letter, id: letterId });
          letterElement.classList.add("visibility-hidden");
          renderInputLetters();
        }
      }
    };

    document.body.addEventListener("keyup", handleKeyUpLetter);
    document.body.addEventListener("keydown", handleKeyDown);
    document.body.addEventListener("keydown", stopLettersBody);
    slagalicaStopBtn.addEventListener("click", stopLetters);
    clearBtn.addEventListener("click", deleteLastLetter);
    submitWordBtn.addEventListener("click", submitWord);

    checkWordBtn.addEventListener("click", () => {
      const word = inputWord.map((elem) => elem.letter).join("");
      console.log(word);
      this._socket.emit("checkWord", { gameId: this._gameId, word });
      wordValidatorDiv.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin-pulse"></i>';
    });

    this._socket.on("wordCheckResult", wordCheckResultHandler);

    slagalicaContainer.append(
      slagalicaInput,
      wordValidatorDiv,
      slagalicaLetters
    );
    if (time > 0) slagalicaContainer.append(slagalicaStopBtn);
    parent.appendChild(slagalicaContainer);
    if (time < 1) {
      submitWord();
      this.removeEveryElement();
      this.createGameMenu();
      //jeftiono rešenje da bi se izbegao bug, EL se nnebrišu ako vreme isteknt a sad te samo izbaci iz igre i vrati u meni
    }
    if (!this._socket.hasListeners("scoreSubmitedSlagalica")) {
      this._socket.on("scoreSubmitedSlagalica", this.popupMessageSlagalica);
    }
  }
  mojBroj(data, parent, stopTimer, time) {
    const firstRow = data.numbers.slice(0, 6);
    const secondRow = data.numbers.slice(6, 8);
    const operators = ["+", "-", "*", "/", "(", ")"];
    const intervals = [];
    const combination = [];
    const nums = [...firstRow,...secondRow];

    const mojBrojContainer = document.createElement("div");
    mojBrojContainer.classList.add("moj-broj-container");

    const c = document.createElement("div");
    c.classList.add("moj-broj-container--container");

    const n1 = document.createElement("div");
    n1.classList.add("moj-broj-container--numbers");

    const n2 = document.createElement("div");
    n2.classList.add("moj-broj-container--first-row");

    const n3 = document.createElement("div");
    n3.classList.add("moj-broj-container--second-row");

    const oc1 = document.createElement("div");
    oc1.classList.add("moj-broj-container--operators");

    const stopSubmitBtn = document.createElement("div");
    stopSubmitBtn.classList.add("moj-broj-container--stop-submit-btn");
    stopSubmitBtn.innerText = "Stop";

    const inpLine = document.createElement("div");
    inpLine.classList.add("moj-broj-container--input-line");

    const inputContainer = document.createElement("div");
    inputContainer.classList.add("moj-broj-container--input-container");

    const tartgetNumber = document.createElement("div");
    tartgetNumber.classList.add("moj-broj-container--target-number");

    const deleteBtn = document.createElement("div");
    deleteBtn.classList.add("moj-broj-container--delete-btn");
    deleteBtn.innerHTML = '<i class="fa-solid fa-delete-left"></i>';

    const oc2 = document.createElement("div");
    oc2.classList.add("moj-broj-container--operator-chars");

    // const pushElement = (e) => {
    //   const element = e.target.innerHTML
    //   if(combination.length > 0 && ["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(combination[combination.length - 1])){
    //     return
    //   }
    //   combination.push(element)
    //   e.target.classList.add("visibility-hidden")
    //   renderCombination()
    //   // const elements = document.querySelectorAll(".moj-broj-container--number")
    //   // const operators = document.querySelectorAll(".moj-broj-container--operator")
    //   // elements.forEach((elem) => {elem.removeEventListener("click",pushElement)})
    //   // operators.forEach((elem) => {elem.addEventListener("click",pushOperant)})
    // }

    // const pushOperant = (e) => {
    //   const element = e.target.innerHTML
    //   if (combination.length === 0 || ["+","-","*","/"].includes(combination[combination.length - 1])){
    //     return
    //   }
    //   if(["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(combination[combination.length - 1])
    //     && element === "(" || combination[combination.length - 1] === ")"
    //     && ["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(element)){
    //     return
    //   }
    //   combination.push(element)
    //   renderCombination()
    //   // const operators = document.querySelectorAll(".moj-broj-container--operator")
    //   // const elements = document.querySelectorAll(".moj-broj-container--number")
    //   // elements.forEach((elem) => {elem.addEventListener("click",pushElement)})
    //   // operators.forEach((elem) => {elem.removeEventListener("click",pushOperant)})
    // }

    const renderCombination = () => {
      inputContainer.innerHTML = "";
      inputContainer.innerHTML = combination.join(" ");
    };

    const pushElement = (e) => {
      const element = e.target.innerHTML;

      const lastElement = combination[combination.length - 1];
      const isValid = validateAddition(lastElement,element)
      
      if(combination.length > 0 && !isValid){
        return
      }
      combination.push(element);
      e.target.classList.add("visibility-hidden");
      renderCombination();
      nums.splice(nums.indexOf(element),1)

    };

    const pushOperant = (e) => {
      const element = e.target.innerHTML;
      const lastElement = combination[combination.length - 1];
      console.log(lastElement);

      const isValid = validateAddition(lastElement,element)
      if(isValid){
        combination.push(element);
        renderCombination();
      }
    };

    const removeElement = () => {
      if (combination.length > 0) {
        const lastElement = combination.pop();

        const elements = document.querySelectorAll(
          `[data-value="${lastElement}"]`
        );

        for (let i = elements.length - 1; i >= 0; i--) {
          if (elements[i].classList.contains("visibility-hidden")) {
            elements[i].classList.remove("visibility-hidden");
            nums.push(Number(elements[i].innerText))
            break;
          }
        }

        renderCombination();
      }
    };
    const interval1 = setInterval(() => {
      tartgetNumber.innerText = Math.floor(Math.random() * 900) + 99;
    }, 100);
    intervals.push(interval1);

    firstRow.forEach((elem, index) => {
      const number = document.createElement("div");
      number.classList.add("moj-broj-container--number");
      number.setAttribute("data-value", elem); //ovde
      const interval2 = setInterval(() => {
        number.innerText = Math.floor(Math.random() * 8) + 1;
      }, 100);
      intervals.push(interval2);
      number.innerText = elem;
      number.addEventListener("click", pushElement);
      n2.appendChild(number);
    });
    n1.appendChild(n2);

    secondRow.forEach((elem, index) => {
      const number = document.createElement("div");
      number.classList.add("moj-broj-container--number");
      number.setAttribute("data-value", elem); //ovde
      const randomNumbers = [10, 15, 20, 25, 50];
      const interval3 = setInterval(() => {
        number.innerText =
          randomNumbers[Math.floor(Math.random() * randomNumbers.length)];
      }, 100);
      intervals.push(interval3);
      number.innerText = elem;
      number.addEventListener("click", pushElement);
      n3.appendChild(number);
    });
    n1.appendChild(n3);

    operators.forEach((elem) => {
      const operator = document.createElement("div");
      operator.classList.add("moj-broj-container--operator");
      operator.setAttribute("data-value", elem); //ovde
      operator.innerText = elem;
      operator.addEventListener("click", pushOperant);
      oc2.appendChild(operator);
    });

    deleteBtn.addEventListener("click", removeElement);

    const submit = () => {
      console.log(combination);
    };

    const stopNumbers = () => {
      intervals.forEach((interval) => clearInterval(interval));
      tartgetNumber.innerText = data.target;
      const e = document.querySelectorAll(".moj-broj-container--number");
      e.forEach((elem, index) => {
        elem.innerText = data.numbers[index];
      });
      stopSubmitBtn.removeEventListener("click", stopNumbers);
      stopSubmitBtn.innerText = "Submit";
      stopSubmitBtn.addEventListener("click", submit);
    };
    const keyDown = (e) => {
      switch (e.keyCode) {
        case 32:
          stopNumbers();
          break;
        case 8:
          removeElement();
          break;
        case 13:
          submit();
          break;
      }
    };
    
    const handleKeyPress = (e) => {      
      const charOptions = [...operators, ...firstRow, ...secondRow];
      const char = numberToLetterMap[e.keyCode];
      // const element = document.querySelector(`[data-value="${char}"]`);
      const lastElement = combination[combination.length - 1];
      const isValid = validateAddition(lastElement,char)

      if (charOptions.includes(char)) {
        if (nums.includes(Number(char)) && isValid) {
          const element = document.querySelector(`[data-value="${char}"]`);
          element.classList.add("visibility-hidden");
          nums.splice(nums.indexOf(Number(char)), 1);
          console.log(nums, nums.includes(Number(char)));
          combination.push(char);
          renderCombination();
        } else if (operators.includes(char) && isValid) {
          combination.push(char);
          renderCombination();
        }
      }
    };

    document.body.addEventListener("keypress", handleKeyPress);
    stopSubmitBtn.addEventListener("click", stopNumbers);

    document.body.addEventListener("keydown", keyDown);
    oc1.append(oc2, deleteBtn);
    c.append(inputContainer, inpLine, n1, oc1, stopSubmitBtn);
    mojBrojContainer.append(tartgetNumber, c);
    parent.appendChild(mojBrojContainer);
  }
  spojnice(data, parent, stopTimer, time) {
    //variables
    let spojnniceIdList = [];
    let leftRow = [];
    let rightRow = [];
    let pick = 0;
    let correctPick = 0;

    //Create dom elements
    const spojniceContainer = document.createElement("div");
    spojniceContainer.classList.add("spojnice-container");
    const p = document.createElement("p");
    p.innerText = data.title;
    const spojniceContainerCards = document.createElement("div");
    spojniceContainerCards.classList.add("spojnice-container--cards");

    const handleClick = (e) => {
      // console.log(leftRow, e.target);

      //const element = document.getElementById(e.target.id);
      const element = e.target;
      element.classList.add("add-dark-bg");

      spojnniceIdList[spojnniceIdList.length - 1] === e.target
        ? spojnniceIdList.pop()
        : spojnniceIdList.push(e.target);
      if (spojnniceIdList.length === 2) {
        leftRow = leftRow.filter((elem) => elem !== spojnniceIdList[0]);
        rightRow = rightRow.filter((elem) => elem !== spojnniceIdList[1]);
        if (spojnniceIdList[0].id === spojnniceIdList[1].id) {
          spojnniceIdList[0].style.backgroundColor = "green";
          spojnniceIdList[1].style.backgroundColor = "green";
          correctPick++;
        } else {
          spojnniceIdList[0].style.backgroundColor = "red";
          spojnniceIdList[1].style.backgroundColor = "red";
        }
        spojnniceIdList[0].removeEventListener("click", handleClick);
        spojnniceIdList[1].removeEventListener("click", handleClick);
        spojnniceIdList = [];
        pick++;
        if (pick === 8) submit();
        console.log(pick);

        rightRow.forEach((elem) => {
          elem.removeEventListener("click", handleClick);
        });
        leftRow.forEach((elem) => {
          elem.addEventListener("click", handleClick);
        });
      } else {
        rightRow.forEach((elem) => {
          elem.addEventListener("click", handleClick);
        });
        leftRow.forEach((elem) => {
          elem.removeEventListener("click", handleClick);
        });
      }
    };

    console.log(data);
    //create spojnice board and cards
    const createBoard = () => {
      data.set.forEach((elem, index) => {
        const card = document.createElement("div");
        card.classList.add("spojnice-container--card");
        card.classList.add(`spojnica-card-index-${index}`);
        card.setAttribute("id", `spojnice-card-${elem.id}`);
        card.innerText = elem.name;
        if (index % 2 === 0) {
          card.addEventListener("click", handleClick);
          leftRow.push(card);
        } else {
          rightRow.push(card);
        }
        spojniceContainerCards.appendChild(card);
      });
      spojniceContainer.append(p, spojniceContainerCards);
    };
    const submit = () => {
      this._socket.emit("submitSpojnice", {
        gameId: this._gameId,
        correctPick,
      });
      stopTimer();
    };
    if (pick === 8 || time <= 0) {
      submit();
      removeAllEventListeners(spojniceContainer);
    } else {
      createBoard();
    }
    this._socket.on("scoreSubmitedSpojnice", () => {
      removeAllEventListeners(spojniceContainer);
    });

    parent.appendChild(spojniceContainer);
  }
  skocko(data, parent, stopTimer, time) {
    const cardIdList = [];
    let clickCounter = 0;
    let cardComb = [];
    let rowCounter = 0;
    let subComb;
    let sub = false;

    // const timerCheckInterval = setInterval(() => {
    //   if (time <= 0) {
    //     clearInterval(timerCheckInterval);
    //     if (!sub) {
    //       submitScore();
    //     }
    //   }
    //   time--;
    // }, 1000);

    const skockoContainer = document.createElement("section");
    skockoContainer.classList.add("skocko-container");

    const createBoard = () => {
      for (let i = 0; i < 6; i++) {
        const cardContainer = document.createElement("aside");
        cardContainer.classList.add("skocko-card-container");

        for (let j = 0; j < 4; j++) {
          const card = document.createElement("div");
          card.classList.add("skocko-card");
          card.setAttribute("id", `skocko_${i}${j}`);
          cardIdList.push(`skocko_${i}${j}`);
          card.innerText = "  ";

          cardContainer.appendChild(card);
        }

        const scoreDisplay = document.createElement("aside");
        scoreDisplay.classList.add("skocko-score-display");
        for (let k = 0; k < 4; k++) {
          const scoreCircle = document.createElement("div");
          scoreCircle.classList.add("score-circle", `score-circle_${i}`);

          scoreCircle.setAttribute("id", `skocko_score_circle_${k}`);
          scoreDisplay.appendChild(scoreCircle);
        }
        cardContainer.appendChild(scoreDisplay);
        skockoContainer.append(cardContainer);
      }
    };

    const handleCardAdd = (index) => {
      const element = document.getElementById(`${cardIdList[clickCounter]}`);
      // element.innerHTML = `<img src="${imagePaths[index]}"/>`; //PROVERI OVVO
      element.innerHTML = `<img src="${this._imgPaths[index]}"/>`;
      element.classList.add("skocko-input-card");
      element.classList.toggle("skocko-card");
      clickCounter++;
      cardComb.push(index);
      checkScore();

      if (clickCounter === cardIdList.length) {
        submitScore();
        stopTimer();
      }
    };

    const createCardOptions = () => {
      const cardOptionMenu = document.createElement("section");
      cardOptionMenu.classList.add("skocko-card-option-menu");

      this._imgPaths.forEach((elem, index) => {
        const inputCard = document.createElement("div");
        inputCard.classList.add("skocko-input-card");
        const img = document.createElement("img");
        img.setAttribute("src", elem);
        inputCard.appendChild(img);
        inputCard.addEventListener("click", () => handleCardAdd(index));
        cardOptionMenu.appendChild(inputCard);
      });
      skockoContainer.appendChild(cardOptionMenu);
    };

    this._socket.on("skockoCheckResult", (data) => {
      const resultCircles = document.querySelectorAll(
        `.score-circle_${rowCounter - 1}`
      );
      let positionCount = data.correctPositions;
      let numberCount = data.correctNumbers;

      resultCircles.forEach((e) => {
        if (positionCount > 0) {
          e.style.backgroundColor = "red";
          positionCount--;
        } else if (numberCount > 0) {
          e.style.backgroundColor = "yellow";
          numberCount--;
        } else {
          e.style.backgroundColor = "";
        }
      });
    });
    const checkScore = () => {
      if (clickCounter % 4 === 0) {
        this._socket.emit("checkSkocko", { gameId: this._gameId, cardComb });
        subComb = [...cardComb];
        cardComb = [];
        rowCounter++;
      }
    };

    const submitScore = () => {
      this._socket.emit("submitSkocko", {
        gameId: this._gameId,
        cardComb: subComb,
      });
      stopTimer();
      removeAllEventListeners(skockoContainer);
      sub = true;
    };

    this._socket.on("scoreSubmitedSkocko", () => {
      stopTimer();
      removeAllEventListeners(skockoContainer);
      sub = true;
    });
    if (time <= 0) {
      if (!sub) {
        submitScore();
      }
    } else {
      createBoard();
      createCardOptions();
    }

    parent.append(skockoContainer);
  }
  koZnaZna(data, parent, stopTimer, time) {
    let qCounter = 0;
    let sub = false;
    let correctAwnser = 0;
    const koznaznaContainer = document.createElement("div");
    koznaznaContainer.classList.add("koznazna-container");
    const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

    const renderQuestion = () => {
      const options = shuffle([...data[qCounter].wrong, data[qCounter].answer]);

      const p = document.createElement("p");
      p.innerText = data[qCounter].question;

      const optionsContainer = document.createElement("div");
      optionsContainer.classList.add("koznazna-container--options");

      options.forEach((elem, index) => {
        const d = document.createElement("div");
        d.classList.add("koznazna-container--card");
        d.innerText = elem;
        if (time > 0) {
          d.addEventListener("click", handleClick);
        }
        optionsContainer.appendChild(d);
      });
      const n = document.createElement("div");
      n.classList.add("koznazna-container--card");
      n.innerText = "NE ZNAM";
      if (time > 0) n.addEventListener("click", handleNext);

      optionsContainer.appendChild(n);
      koznaznaContainer.append(p, optionsContainer);
    };
    const handleNext = (e) => {
      e.target.classList.add("add-dark-bg");

      setTimeout(() => {
        qCounter++;
        this.removeElement(koznaznaContainer);
        if (qCounter < data.length) {
          renderQuestion();
        } else {
          console.log("Quiz finished");
          if (!sub) {
            stopTimer();
            this._socket.emit("endKoznazna", { gameId: this._gameId });
            sub = true;
          }
        }
      }, 1000);
    };
    const handleClick = (e) => {
      console.log(e.target.innerText);
      e.target.classList.add("add-dark-bg");

      setTimeout(() => {
        if (e.target.innerText === data[qCounter].answer) {
          e.target.style.backgroundColor = "green";
          this._socket.emit("submitkoznazna", {
            gameId: this._gameId,
            points: 3,
          });
        } else {
          e.target.style.backgroundColor = "red";
          this._socket.emit("submitkoznazna", {
            gameId: this._gameId,
            points: -1,
          });
        }

        setTimeout(() => {
          qCounter++;
          this.removeElement(koznaznaContainer);
          if (qCounter < data.length) {
            renderQuestion();
          } else {
            console.log("Quiz finished");
            if (!sub) {
              stopTimer();
              this._socket.emit("endKoznazna", { gameId: this._gameId });
              sub = true;
            }
          }
        }, 1000);
      }, 1000);
    };
    this._socket.on("addScoreKoznazna", (data) => {
      correctAwnser += data.data;
      console.log(data);
    });

    let newTime = time;
    if (newTime > 0) renderQuestion();

    if (!this._socket.hasListeners("scoreSubmitedKoznazna")) {
      this._socket.on("scoreSubmitedKoznazna", this.popupMessageDefault);
    }
    parent.append(koznaznaContainer);

    const timerCheckInterval = setInterval(() => {
      if (newTime <= 0 && !sub) {
        clearInterval(timerCheckInterval);
        if (!sub) {
          stopTimer();
          this._socket.emit("endKoznazna", { gameId: this._gameId });
          sub = true;
        }
        removeAllEventListeners(koznaznaContainer);
      }
      newTime--;
    }, 1000);
  }
  asocijacije(data, parent, stopTimer, time) {
    console.log(data);
    console.log(data.asocijacija);

    const indexMap = { 1: "A", 2: "B", 3: "C", 4: "D" };
    let points = 0;
    let sub = false;
    let newTime = time;

    const asocijacijeContainer = document.createElement("div");
    asocijacijeContainer.classList.add("asocijacije-container");

    const resultInput = document.createElement("input");
    resultInput.classList.add("asocijacije-result-input");
    resultInput.placeholder = "Konačno rešenje";
    resultInput.readOnly = true;
    resultInput.style.textTransform = "uppercase";

    const handleMainInputInput = (e) => {
      e.preventDefault();
      if (e.keyCode === 13) {
        console.log("submit asocijacije");

        if (
          resultInput.value &&
          resultInput.value.toUpperCase() === data.asocijacija.konačnoRešenje
        ) {
          resultInput.style.background = GREEN_BUTTON_BACKGROUND;
          resultInput.readOnly = true;
          points = 30;

          const cards = document.querySelectorAll(".asocijacije-card");
          const inputs = document.querySelectorAll(".asocijacije-input");

          for (let i = 0; i < data.asocijacija.columns.length; i++) {
            for (
              let j = 0;
              j < data.asocijacija.columns[i].pojmovi.length;
              j++
            ) {
              cards[i * 4 + j].innerText =
                data.asocijacija.columns[i].pojmovi[j];
              cards[i * 4 + j].style.background = GREEN_BUTTON_BACKGROUND;
              cards[i * 4 + j].classList.add("asocijacije-card--clicked");
              inputs[i].readOnly = true;
              inputs[i].value = data.asocijacija.columns[i].rešenje;
              inputs[i].style.background = GREEN_BUTTON_BACKGROUND;
            }
          }
          submit();
        } else {
          resultInput.style.background = RED_BUTTON_BACKGROUND;
          resultInput.style.color = "#fff";
          setTimeout(() => {
            resultInput.style.background = "";
            resultInput.style.color = "";
            resultInput.value = "";
          }, 500);
        }
      }
    };
    resultInput.addEventListener("keyup", handleMainInputInput);

    const createInput = (index, elem) => {
      const inp = document.createElement("input");
      inp.classList.add("asocijacije-input");
      inp.setAttribute("id", `asocijacije-input-${index}`);
      inp.placeholder = `Rešenje kolone ${indexMap[index + 1]}`;
      inp.readOnly = true;
      inp.style.textTransform = "uppercase";
      inp.addEventListener("keyup", (e) => {
        if (e.keyCode === 13) {
          console.log(e.keyCode);

          e.preventDefault();
          const word = e.target.value.toUpperCase();
          if (word && word === data.asocijacija.columns[index].rešenje) {
            console.log(word, data.asocijacija.columns[index].rešenje);

            inp.style.background = GREEN_BUTTON_BACKGROUND;
            const cards = document.querySelectorAll(
              `[cardRow="asocijacije-card-${index}"]`
            );
            cards.forEach((card, i) => {
              setTimeout(() => {
                card.innerText = data.asocijacija.columns[index].pojmovi[i];
                card.style.background = GREEN_BUTTON_BACKGROUND;
                card.classList.add("asocijacije-card--clicked");
              }, i * 50);
            });
            inp.readOnly = true;
            resultInput.readOnly = false;
            points += 5;
          } else {
            inp.style.background = RED_BUTTON_BACKGROUND;
            inp.style.color = "#fff";
            setTimeout(() => {
              inp.style.background = "";
              inp.style.color = "";
              inp.value = "";
            }, 500);
          }
        }
      });
      elem.appendChild(inp);
    };

    const createBoard = () => {
      const board = document.createElement("div");
      board.classList.add("asocijacije-board");

      data.asocijacija.columns.forEach((elem, index) => {
        if (index === 2) board.appendChild(resultInput);

        const column = document.createElement("span");
        column.classList.add("asocijacije-column");

        if (index > 1) createInput(index, column);

        elem.pojmovi.forEach((e, i) => {
          const card = document.createElement("div");
          card.classList.add("asocijacije-card");
          card.setAttribute("cardRow", `asocijacije-card-${index}`);
          card.innerText = `${indexMap[index + 1]}${i + 1}`;

          card.addEventListener("click", (event) => {
            if (card.classList.contains("asocijacije-card--clicked")) return;
            event.preventDefault();
            card.innerText = e;
            card.style.background = BLUE_BUTTON_BACKGROUND;
            card.classList.add("asocijacije-card--clicked");
            const input = document.querySelector(`#asocijacije-input-${index}`);
            input.readOnly = false;
          });
          column.appendChild(card);
        });
        if (index < 2) createInput(index, column);
        board.appendChild(column);
      });
      asocijacijeContainer.appendChild(board);
    };

    const submit = () => {
      clearInterval(timerCheckInterval);
      if (!sub) {
        stopTimer();
        this._socket.emit("submitAsocijacije", {
          gameId: this._gameId,
          points,
        });
        sub = true;
      }
      resultInput.readOnly = true;
      const inputs = document.querySelectorAll(".asocijacije-input");
      inputs.forEach((input) => {
        input.readOnly = true;
      });
      removeAllEventListeners(asocijacijeContainer);
    };

    const timerCheckInterval = setInterval(() => {
      newTime--;
      if (newTime <= 0) {
        submit();
        console.log("submit asocijacije");
      }
    }, 1000);

    createBoard();

    if (!this._socket.hasListeners("scoreSubmitedAsocijacije")) {
      this._socket.on("scoreSubmitedAsocijacije", this.popupMessageDefault);
    }
    parent.append(asocijacijeContainer);
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
  removeParent(child) {
    document.body.removeChild(child);
  }
  reversePlayerIndex() {
    const currentPlayerIndex = this._players.findIndex(
      (player) => player.id === this._socket.id
    );
    if (currentPlayerIndex !== -1) {
      const [currentPlayer] = this._players.splice(currentPlayerIndex, 1);
      this._players.unshift(currentPlayer);
    }
  }
  drawPopup(text, addElementsCallback) {
    const popup = document.createElement("div");
    popup.classList.add("popup-container");
    popup.setAttribute("id", "popup-game");

    const popupMessage = document.createElement("div");
    popupMessage.classList.add("popup-container--message");

    const popupText = document.createElement("p");
    popupMessage.innerText = text;

    const popupBtn = document.createElement("div");
    popupBtn.classList.add("popup-container--btn");
    popupBtn.innerText = "OK";

    popupBtn.addEventListener("click", () => {
      this._element.removeChild(popup);
    });

    if (addElementsCallback) {
      addElementsCallback(popupMessage);
    }

    popupMessage.append(popupText, popupBtn);
    popup.appendChild(popupMessage);
    this._element.appendChild(popup);
  }
  popupMessageDefault = (t) => {
    let text;
    console.log(t);
    if (t) {
      t.data > 0
        ? (text = `🥳Osvojili ste ${t.data} poena🥳`)
        : (text = `🤡Osvojili ste ${t.data} poena🤡`);
    } else {
      text = `🤡Osvojili ste 0 poena🤡`;
    }
    this.drawPopup(text, () => {});
  };
  popupMessageSlagalica = (t) => {
    // const text = `Osvojili ste ${t.data} poena`;
    let text;
    t.data > 0
      ? (text = `🥳Osvojili ste ${t.data} poena🥳`)
      : (text = `🤡Osvojili ste ${t.data} poena🤡`);
    this.drawPopup(text, (m) => {
      const p1 = document.createElement("p");
      p1.innerText = "Naša reč:";

      const p2 = document.createElement("p");
      p2.innerText = this._gameState.slagalica.word;
      p2.style.fontWeight = 600;
      p2.style.fontSize = "1.1rem";

      m.append(p1, p2);
    });
  };
  popupMessageSkocko = (t) => {
    const text = `Osvojili ste ${t.data} poena`;
    this.drawPopup(text, (popupMessageSkocko) => {
      const combination = document.createElement("div");
      combination.classList.add("popup-combination-skocko");

      const p = document.createElement("p");
      p.innerText = "Tačna kombinacija:";

      const skockoCombination = document.createElement("section");

      this._gameState.skocko.forEach((e, ind) => {
        const c = document.createElement("div");
        c.classList.add("popup-combination-skocko--card");

        const img = document.createElement("img");
        img.setAttribute("src", this._imgPaths[e]);

        c.appendChild(img);
        skockoCombination.appendChild(c);
      });
      combination.append(p, skockoCombination);
      popupMessageSkocko.appendChild(combination);
    });
  };
}

/**
 * @readonly
 * @description Socket event names used for communication between server and clients.
 */
export const SOCKET_EVENTS = Object.freeze({
    CORE: {
        CONNECTION: "connection",
        DISCONNECT: "disconnect",
        ENTER_ROOM: "enterRoom",
        RECONNECT: "reconnectPlayer",
        ENTER_SINGLE_PLAYER: "enterSinglePlayer",
        LEAVE_GAME: "leaveGame",
        OPPONENT_LEFT: "opponentLeft",
    },

    STATE: {
        REQUEST_PLAYER_DATA: "requestPlayerData",
        PLAYERS_STATE: "playersState",
        OPEN_GAME: "opendGame",
        GAME_DATA: "gameData",
        CHECK_COMPLETED: "checkIfCompleted",
        GAME_COMPLETED: "gameCompleted",
        START_GAME: "startGame",
        START_SINGLE_PLAYER: "startSinglePlayerGame",
        NOTIFICATION: "notification",
    },

    // Specific Minigames
    GAMES: {
        SLAGALICA: {
            CHECK: "checkWord",
            RESULT: "wordCheckResult",
            SUBMIT: "sendSlagalicaScore",
            SUCCESS: "scoreSubmitedSlagalica",
        },
        SKOCKO: {
            CHECK: "checkSkocko",
            RESULT: "skockoCheckResult",
            SUBMIT: "submitSkocko",
            SUCCESS: "scoreSubmitedSkocko",
        },
        SPOJNICE: {
            SUBMIT: "submitSpojnice",
            SUCCESS: "scoreSubmitedSpojnice",
        },
        KO_ZNA_ZNA: {
            SUBMIT: "submitKoZnaZna",
            ADD_POINTS: "addScoreKoZnaZna",
            END: "endKoZnaZna",
            SUCCESS: "scoreSubmitedKoZnaZna",
        },
        ASOCIJACIJE: {
            SUBMIT: "submitAsocijacije",
            SUCCESS: "scoreSubmitedAsocijacije",
        },
        MOJ_BROJ: {
            SUBMIT: "submitMojBroj",
            SUCCESS: "scoreSubmitedMojBroj",
        },
    },
});

export const GAME_KEYS = Object.freeze({
    SLAGALICA: "slagalica",
    SKOCKO: "skocko",
    SPOJNICE: "spojnice",
    KO_ZNA_ZNA: "koZnaZna",
    ASOCIJACIJE: "asocijacije",
    MOJ_BROJ: "mojBroj",
});

export const VIEWS = Object.freeze({
    LOBY: "loby",
    MENU: "menu",
});
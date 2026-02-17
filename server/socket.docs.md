# Socket.IO Events Documentation

## Overview

This document provides comprehensive documentation for all Socket.IO events used in the game server. The server handles real-time multiplayer and single-player game sessions with various mini-games.

---

## Table of Contents

1. [Connection Events](#connection-events)
2. [Room Management Events](#room-management-events)
3. [Game State Events](#game-state-events)
4. [Game-Specific Events](#game-specific-events)
   - [Slagalica](#slagalica-word-game)
   - [Skocko](#skocko-card-game)
   - [Spojnice](#spojnice-connections-game)
   - [Ko Zna Zna](#ko-zna-zna-quiz-game)
   - [Asocijacije](#asocijacije-associations-game)
   - [Moj Broj](#moj-broj-numbers-game)

---

## Connection Events

### Client → Server

#### `connection`
- **Trigger**: Automatically when client connects
- **Payload**: None
- **Description**: Establishes WebSocket connection with the server
- **Response**: Server emits the socket ID back to client

#### `disconnect`
- **Trigger**: When client connection is lost
- **Payload**: 
  ```typescript
  {
    reason: string  // Disconnect reason
  }
  ```
- **Description**: Handles cleanup when a player disconnects
- **Server Actions**:
  - Notifies other player in the game
  - Cleans up game if no players remain
  - Removes player from game session

---

## Room Management Events

### Client → Server

#### `ENTER_ROOM`
- **Purpose**: Join a multiplayer game room
- **Payload**:
  ```typescript
  {
    name: string,        // Player's display name
    game: string | null  // Game ID to join (null for new game)
  }
  ```
- **Validations**:
  - Name must be a non-empty string
  - Room must have fewer than 2 players
- **Server Responses**:
  - **Success**: Player joins room and receives game state
  - **Room Full**: `NOTIFICATION` event with "Room is full"
  - **Invalid Name**: `NOTIFICATION` event with "Invalid name provided"
- **Server Actions**:
  - Creates new game if needed
  - Adds player to game
  - Notifies other player when someone joins
  - Emits `START_GAME` when 2 players are ready

#### `ENTER_SINGLE_PLAYER`
- **Purpose**: Start a single-player game session
- **Payload**:
  ```typescript
  {
    name: string  // Player's display name
  }
  ```
- **Validations**:
  - Name must be a non-empty string
- **Server Response**:
  - **Success**: `startSinglePlayerGame` with game object
  - **Error**: `NOTIFICATION` with "Failed to start single player game"
- **Server Actions**:
  - Creates new single-player game (ID prefix: "sg")
  - Initializes game state
  - Sends complete game object to client

#### `RECONNECT`
- **Purpose**: Reconnect to an existing game session
- **Payload**:
  ```typescript
  {
    gameId: string,  // Game session ID
    name: string     // Player's display name
  }
  ```
- **Server Responses**:
  - **Player Found**: Updates socket ID and sends current game state
  - **New Slot**: Adds player if room has space
  - **Room Full**: `NOTIFICATION` with "Room is full"
  - **Game Not Found**: `NOTIFICATION` with "Game not found"
- **Server Actions**:
  - Updates existing player's socket ID
  - Or adds player to available slot
  - Sends `PLAYERS_STATE` and `GAME_DATA` to reconnected player
  - Notifies room of player reconnection

#### `LEAVE_GAME`
- **Purpose**: Voluntarily leave the current game
- **Payload**: None (uses socket.id to identify player)
- **Server Actions**:
  - Removes player from game
  - Emits `OPPONENT_LEFT` to other player
  - Cleans up game if no players remain

---

## Game State Events

### Client → Server

#### `REQUEST_PLAYER_DATA`
- **Purpose**: Request current player states and scores
- **Payload**:
  ```typescript
  gameId: string  // Game session ID
  ```
- **Server Response**:
  - **Success**: `PLAYERS_STATE` with complete game object
  - **Error**: `NOTIFICATION` with "Game not found"
- **Response Scope**:
  - Single-player: Only to requesting socket
  - Multiplayer: Broadcast to entire room

#### `OPEN_GAME`
- **Purpose**: Open/initialize a specific mini-game
- **Payload**:
  ```typescript
  {
    gameId: string,    // Game session ID
    gameKey: string,   // Mini-game identifier (e.g., "slagalica", "skocko")
    playerId: string   // Player's socket ID
  }
  ```
- **Server Response**:
  - **Success**: `gameData` with specific game data
  - **Error**: `NOTIFICATION` with "Game not found" or "Failed to open game"
- **Server Actions**:
  - Marks game as opened for that player
  - Returns game-specific data (letters, cards, questions, etc.)

#### `CHECK_COMPLETED`
- **Purpose**: Check if all mini-games are completed
- **Payload**:
  ```typescript
  {
    gameId: string  // Game session ID
  }
  ```
- **Server Response**:
  - **If Completed**: `GAME_COMPLETED` with final scores
  - **If Not Completed**: No response
- **Response Scope**:
  - Single-player: Only to requesting socket
  - Multiplayer: Broadcast to entire room

### Server → Client

#### `NOTIFICATION`
- **Purpose**: Send informational or error messages
- **Payload**: `string` (message text)
- **Common Messages**:
  - "Room is full"
  - "Invalid name provided"
  - "Game not found"
  - "Failed to join room"
  - "[Player Name] joined the game"

#### `START_GAME`
- **Purpose**: Signal that game is ready to start (2 players joined)
- **Payload**:
  ```typescript
  {
    game: Game  // Complete game object
  }
  ```
- **Trigger**: When second player joins the room

#### `startSinglePlayerGame`
- **Purpose**: Initialize single-player game
- **Payload**:
  ```typescript
  {
    game: Game  // Complete game object
  }
  ```

#### `PLAYERS_STATE`
- **Purpose**: Send updated player data and scores
- **Payload**: `Game` object containing all player states

#### `GAME_DATA`
- **Purpose**: Send game-specific data after opening a mini-game
- **Payload**: Object containing game-specific data (varies by game type)

#### `GAME_COMPLETED`
- **Purpose**: Send final results when all games are finished
- **Payload**:
  ```typescript
  {
    data: {
      winner: Player,      // Winning player object
      players: Player[]    // All players with final scores
    }
  }
  ```

#### `OPPONENT_LEFT`
- **Purpose**: Notify that the other player has left
- **Payload**: `string` ("Opponent left the game")

---

## Game-Specific Events

### Slagalica (Word Game)

#### Client → Server: `SLAGALICA_CHECK`
- **Purpose**: Validate a word without submitting
- **Payload**:
  ```typescript
  {
    gameId: string,
    word: string  // Word to validate
  }
  ```
- **Server Response**: `wordCheckResult`
  ```typescript
  {
    valid: boolean,
    score: number,
    word: string
  }
  ```

#### Client → Server: `SLAGALICA_SUBMIT`
- **Purpose**: Submit final word and score
- **Payload**:
  ```typescript
  {
    gameId: string,
    word: string  // Final word submission
  }
  ```
- **Server Response**: `SLAGALICA_SUCCESS`
  ```typescript
  {
    data: number  // Points awarded
  }
  ```
- **Server Actions**:
  - Validates word
  - Adds score to player's total
  - Marks Slagalica as completed for player

---

### Skocko (Card Game)

#### Client → Server: `SKOCKO_CHECK`
- **Purpose**: Check a card combination attempt
- **Payload**:
  ```typescript
  {
    gameId: string,
    cardComb: number[]  // Array of 4 card indices
  }
  ```
- **Server Responses**:
  - `SKOCKO_RESULT`: Feedback on the attempt
    ```typescript
    {
      correctPositions: number,  // Cards in correct position
      correctCards: number,      // Correct cards in wrong position
      score: number              // Points if solved
    }
    ```
  - `SKOCKO_SUCCESS`: If all 4 cards are correct
    ```typescript
    {
      data: number  // Points awarded
    }
    ```

#### Client → Server: `SKOCKO_SUBMIT`
- **Purpose**: Submit Skocko score (when giving up or time expires)
- **Payload**:
  ```typescript
  {
    gameId: string,
    cardComb: number[]  // Last attempt
  }
  ```
- **Server Response**: `scoreSubmitedSkocko`
  ```typescript
  {
    data: number  // Points awarded (may be 0)
  }
  ```

---

### Spojnice (Connections Game)

#### Client → Server: `SPOJNICE_SUBMIT`
- **Purpose**: Submit number of correct connections made
- **Payload**:
  ```typescript
  {
    gameId: string,
    correctPick: number  // Number of correct matches (0-4)
  }
  ```
- **Server Response**: `scoreSubmitedSpojnice`
  ```typescript
  {
    data: number  // Points awarded based on correct matches
  }
  ```
- **Scoring**: Based on number of correct connections validated

---

### Ko Zna Zna (Quiz Game)

#### Client → Server: `KO_ZNA_ZNA_SUBMIT`
- **Purpose**: Add points for a correct answer during the quiz
- **Payload**:
  ```typescript
  {
    gameId: string,
    points: string | number  // Points to add (converted to number)
  }
  ```
- **Validations**:
  - Points must be convertible to a valid number
- **Server Response**: `addScoreKoznazna`
  ```typescript
  {
    data: number  // Current total score for Ko Zna Zna
  }
  ```
- **Note**: Can be called multiple times during the game

#### Client → Server: `KO_ZNA_ZNA_END`
- **Purpose**: Finalize Ko Zna Zna game and get final score
- **Payload**:
  ```typescript
  {
    gameId: string
  }
  ```
- **Server Response**: `scoreSubmitedKoznazna`
  ```typescript
  {
    data: number  // Final total score
  }
  ```

---

### Asocijacije (Associations Game)

#### Client → Server: `ASOCIJACIJE_SUBMIT`
- **Purpose**: Submit final score for Asocijacije
- **Payload**:
  ```typescript
  {
    gameId: string,
    points: string | number  // Total points earned
  }
  ```
- **Validations**:
  - Points must be convertible to a valid number
- **Server Response**: `scoreSubmitedAsocijacije`
  ```typescript
  {
    data: number  // Points awarded
  }
  ```

---

### Moj Broj (Numbers Game)

#### Client → Server: `MOJ_BROJ_SUBMIT`
- **Purpose**: Submit mathematical combination/solution
- **Payload**:
  ```typescript
  {
    gameId: string,
    combination: string  // Mathematical expression (e.g., "(10+5)*2")
  }
  ```
- **Server Response**: `MOJ_BROJ_SUCCESS`
  ```typescript
  {
    data: number  // Points awarded based on solution accuracy
  }
  ```
- **Server Actions**:
  - Validates mathematical expression
  - Checks if result matches target number
  - Awards points based on accuracy

---

## Event Constants Structure

The server uses structured event constants (from `Constants.js`):

```typescript
SOCKET_EVENTS = {
  CORE: {
    CONNECTION: "connection",
    DISCONNECT: "disconnect",
    ENTER_ROOM: "enterRoom",
    ENTER_SINGLE_PLAYER: "enterSinglePlayer",
    RECONNECT: "reconnect",
    LEAVE_GAME: "leaveGame",
    OPPONENT_LEFT: "opponentLeft"
  },
  STATE: {
    NOTIFICATION: "notification",
    START_GAME: "startGame",
    PLAYERS_STATE: "playersState",
    GAME_DATA: "gameData",
    REQUEST_PLAYER_DATA: "requestPlayerData",
    OPEN_GAME: "openGame",
    CHECK_COMPLETED: "checkCompleted",
    GAME_COMPLETED: "gameCompleted"
  },
  GAMES: {
    SLAGALICA: {
      CHECK: "checkSlagalica",
      SUBMIT: "submitSlagalica",
      SUCCESS: "slagalicaSuccess"
    },
    SKOCKO: {
      CHECK: "checkSkocko",
      SUBMIT: "submitSkocko",
      RESULT: "skockoResult",
      SUCCESS: "skockoSuccess"
    },
    SPOJNICE: {
      SUBMIT: "submitSpojnice"
    },
    KO_ZNA_ZNA: {
      SUBMIT: "submitKoZnaZna",
      END: "endKoZnaZna"
    },
    ASOCIJACIJE: {
      SUBMIT: "submitAsocijacije"
    },
    MOJ_BROJ: {
      SUBMIT: "submitMojBroj",
      SUCCESS: "mojBrojSuccess"
    }
  }
}
```

---

## Game Flow Examples

### Starting a Multiplayer Game

```
Client 1 → ENTER_ROOM { name: "Alice", game: null }
Server → Client 1: Player added to game

Client 2 → ENTER_ROOM { name: "Bob", game: "123-456-789" }
Server → Client 1: NOTIFICATION "Bob joined the game"
Server → Both: START_GAME { game: {...} }
```

### Playing a Mini-Game (Slagalica)

```
Client → OPEN_GAME { gameId: "123-456-789", gameKey: "slagalica", playerId: "abc123" }
Server → Client: gameData { letters: [...], ... }

Client → SLAGALICA_CHECK { gameId: "123-456-789", word: "TEST" }
Server → Client: wordCheckResult { valid: true, score: 4, word: "TEST" }

Client → SLAGALICA_SUBMIT { gameId: "123-456-789", word: "TESTING" }
Server → Client: SLAGALICA_SUCCESS { data: 7 }
```

### Checking Game Completion

```
Client → CHECK_COMPLETED { gameId: "123-456-789" }
Server → All (if completed): GAME_COMPLETED { 
  data: {
    winner: { name: "Alice", totalScore: 45 },
    players: [...]
  }
}
```

---

## Error Handling

All event handlers include try-catch blocks. Common error responses:

- **Game Not Found**: `NOTIFICATION` - "Game not found"
- **Invalid Input**: `NOTIFICATION` - "Invalid [parameter] provided"
- **Room Full**: `NOTIFICATION` - "Room is full"
- **Operation Failed**: `NOTIFICATION` - "Failed to [operation]"

---

## Notes

1. **Game IDs**: 
   - Multiplayer: Format `XXX-XXX-XXX` (e.g., "123-456-789")
   - Single-player: Format `sgXXX-XXX-XXX` (prefix "sg")

2. **Player Identification**: Uses `socket.id` internally

3. **Room Broadcasting**: 
   - Use `io.to(gameId).emit()` for multiplayer
   - Use `socket.emit()` for single-player

4. **Score Tracking**: Scores are cumulative across all mini-games

5. **Game Completion**: Automatically checked after each game submission
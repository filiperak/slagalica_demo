import { Server, Socket } from "socket.io";
import { Game } from "./GameEngine.js";
import { SOCKET_EVENTS, GAME_KEYS } from "./Constants.js";

interface EnterRoomEvent {
    name: string;
    game: string | null;
}

interface EnterSinglePlayerEvent {
    name: string;
}

interface ReconnectEvent {
    gameId: string;
    name: string;
}

interface OpenGameEvent {
    gameId: string;
    gameKey: string;
    playerId: string;
}

interface GameIdEvent {
    gameId: string;
}

interface SlagalicaCheckEvent {
    gameId: string;
    word: string;
}

interface SlagalicaSubmitEvent {
    gameId: string;
    word: string;
}

interface SkockoCheckEvent {
    gameId: string;
    cardComb: number[];
}

interface SkockoSubmitEvent {
    gameId: string;
    cardComb: number[];
}

interface SpojniceSubmitEvent {
    gameId: string;
    correctPick: number;
}

interface KoZnaZnaSubmitEvent {
    gameId: string;
    points: string | number;
}

interface AsocijacijeSubmitEvent {
    gameId: string;
    points: string | number;
}

interface MojBrojSubmitEvent {
    gameId: string;
    combination: string;
}

export class SocketHandler {
    private io: Server;
    private games: Record<string, Game> = {};
    private tempGame: string | null = null;
    private clientNo: number = 0;

    constructor(io: Server) {
        this.io = io;
        this.init();
    }

    private init(): void {
        this.io.on(SOCKET_EVENTS.CORE.CONNECTION, (socket: Socket) => {
            this.handleConnection(socket);
        });
    }

    private handleConnection(socket: Socket): void {
        socket.emit(socket.id);
        console.log(`New connection: ${socket.id}`);

        // Register all event handlers
        socket.on(SOCKET_EVENTS.CORE.ENTER_ROOM, (data: EnterRoomEvent) =>
            this.handleEnterRoom(socket, data)
        );
        socket.on(SOCKET_EVENTS.CORE.RECONNECT, (data: ReconnectEvent) =>
            this.handleReconnect(socket, data)
        );
        socket.on(SOCKET_EVENTS.CORE.ENTER_SINGLE_PLAYER, (data: EnterSinglePlayerEvent) =>
            this.handleEnterSinglePlayer(socket, data)
        );
        socket.on(SOCKET_EVENTS.STATE.REQUEST_PLAYER_DATA, (gameId: string) =>
            this.handleRequestPlayerData(socket, gameId)
        );
        socket.on(SOCKET_EVENTS.STATE.OPEN_GAME, (data: OpenGameEvent) =>
            this.handleOpenGame(socket, data)
        );
        socket.on(SOCKET_EVENTS.STATE.CHECK_COMPLETED, (data: GameIdEvent) =>
            this.handleCheckIfCompleted(socket, data)
        );
        socket.on(SOCKET_EVENTS.STATE.PLAYER_FINISHED, (data: GameIdEvent) =>
            this.handlePlayerFinished(socket, data)
        );

        // Game-specific event handlers
        socket.on(SOCKET_EVENTS.GAMES.SLAGALICA.CHECK, (data: SlagalicaCheckEvent) =>
            this.handleCheckWord(socket, data)
        );
        socket.on(SOCKET_EVENTS.GAMES.SLAGALICA.SUBMIT, (data: SlagalicaSubmitEvent) =>
            this.handleSendSlagalicaScore(socket, data)
        );
        socket.on(SOCKET_EVENTS.GAMES.SKOCKO.CHECK, (data: SkockoCheckEvent) =>
            this.handleCheckSkocko(socket, data)
        );
        socket.on(SOCKET_EVENTS.GAMES.SKOCKO.SUBMIT, (data: SkockoSubmitEvent) =>
            this.handleSubmitSkocko(socket, data)
        );
        socket.on(SOCKET_EVENTS.GAMES.SPOJNICE.SUBMIT, (data: SpojniceSubmitEvent) =>
            this.handleSubmitSpojnice(socket, data)
        );
        socket.on(SOCKET_EVENTS.GAMES.KO_ZNA_ZNA.SUBMIT, (data: KoZnaZnaSubmitEvent) =>
            this.handleSubmitKoznazna(socket, data)
        );
        socket.on(SOCKET_EVENTS.GAMES.KO_ZNA_ZNA.END, (data: GameIdEvent) =>
            this.handleEndKoznazna(socket, data)
        );
        socket.on(SOCKET_EVENTS.GAMES.ASOCIJACIJE.SUBMIT, (data: AsocijacijeSubmitEvent) =>
            this.handleSubmitAsocijacije(socket, data)
        );
        socket.on(SOCKET_EVENTS.GAMES.MOJ_BROJ.SUBMIT, (data: MojBrojSubmitEvent) =>
            this.handleSubmitMojBroj(socket, data)
        );

        // Connection handlers
        socket.on(SOCKET_EVENTS.CORE.LEAVE_GAME, () => this.handleLeaveGame(socket));
        socket.on(SOCKET_EVENTS.CORE.DISCONNECT, (reason: string) =>
            this.handleDisconnect(socket, reason)
        );
    }

    private handleEnterRoom(socket: Socket, { name, game }: EnterRoomEvent): void {
        try {
            if (!name || typeof name !== "string") {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Invalid name provided");
                return;
            }

            const gameId = this.determineGameId(game);
            const playerGame = this.getOrCreateGame(gameId);

            if (playerGame.players.length >= 2) {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Room is full");
                return;
            }

            const newPlayer = playerGame.addPlayer(socket.id, name);
            if (!newPlayer) {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Room is full");
                return;
            }

            socket.join(gameId);
            console.log(`Player ${name} joined game ${gameId}`);

            socket.to(gameId).emit(SOCKET_EVENTS.STATE.NOTIFICATION, `${name} joined the game`);

            if (playerGame.isReady()) {
                this.io.to(gameId).emit(SOCKET_EVENTS.STATE.START_GAME, {
                    game: this.games[gameId],
                });
            }
        } catch (error) {
            console.error("Error in handleEnterRoom:", error);
            socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Failed to join room");
        }
    }

    private handleEnterSinglePlayer(socket: Socket, { name }: EnterSinglePlayerEvent): void {
        try {
            if (!name || typeof name !== "string") {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Invalid name provided");
                return;
            }

            const gameId = this.createGameId(true);
            console.log(`Single player game created: ${gameId} for singlegame`);

            const singlePlayerGame = new Game(gameId);
            this.games[gameId] = singlePlayerGame;
            singlePlayerGame.addPlayer(socket.id, name);
            socket.join(gameId);

            socket.emit("startSinglePlayerGame", { game: this.games[gameId] });
        } catch (error) {
            console.error("Error in handleEnterSinglePlayer:", error);
            socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Failed to start single player game");
        }
    }

    private handleRequestPlayerData(socket: Socket, gameId: string): void {
        try {
            const game = this.getGame(gameId);
            if (!game) {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Game not found");
                return;
            }

            if (this.isSinglePlayerGame(gameId)) {
                socket.emit(SOCKET_EVENTS.STATE.PLAYERS_STATE, game);
            } else {
                this.io.to(gameId).emit(SOCKET_EVENTS.STATE.PLAYERS_STATE, game);
            }
        } catch (error) {
            console.error("Error in handleRequestPlayerData:", error);
        }
    }

    private handleOpenGame(socket: Socket, { gameId, gameKey, playerId }: OpenGameEvent): void {
        console.log(
            `Open game requested: ${gameKey} for gameId: ${gameId} by playerId: ${playerId}`
        );
        try {
            const currentGame = this.getGame(gameId);
            if (!currentGame) {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Game not found");
                return;
            }

            currentGame.handleOpendGame(gameKey, playerId);
            console.log(playerId, currentGame.gameState[gameKey as keyof typeof currentGame.gameState]);

            const response = {
                gameKey,
                gameState: currentGame.gameState[gameKey as keyof typeof currentGame.gameState],
            };

            socket.emit(SOCKET_EVENTS.STATE.GAME_DATA, response);

            if (this.isSinglePlayerGame(gameId)) {
                socket.emit(SOCKET_EVENTS.STATE.PLAYERS_STATE, currentGame);
            } else {
                this.io.to(gameId).emit(SOCKET_EVENTS.STATE.PLAYERS_STATE, currentGame);
            }
        } catch (error) {
            console.error("Error in handleOpenGame:", error);
            socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Failed to open game");
        }
    }

    private handleCheckIfCompleted(socket: Socket, { gameId }: GameIdEvent): void {
        try {
            const game = this.getGame(gameId);
            if (!game) {
                console.error(`Game not found: ${gameId}`);
                return;
            }

            const isCompleted = game.isCompleted();
            if (isCompleted) {
                const finalScore = game.checkWinner();

                if (this.isSinglePlayerGame(gameId)) {
                    socket.emit(SOCKET_EVENTS.STATE.GAME_COMPLETED, { data: finalScore });
                } else {
                    this.io
                        .to(gameId)
                        .emit(SOCKET_EVENTS.STATE.GAME_COMPLETED, { data: finalScore });
                }
            }
        } catch (error) {
            console.error("Error in handleCheckIfCompleted:", error);
        }
    }

    private handlePlayerFinished(socket: Socket, { gameId }: GameIdEvent): void {
        try {
            const game = this.getGame(gameId);
            if (!game) return;

            game.markPlayerFinished(socket.id);
            console.log(`Player ${socket.id} finished all games in ${gameId}`);

            if (game.bothPlayersFinished()) {
                const finalScore = game.checkWinner();
                this.io.to(gameId).emit(SOCKET_EVENTS.STATE.GAME_COMPLETED, { data: finalScore });
            }
        } catch (error) {
            console.error("Error in handlePlayerFinished:", error);
        }
    }

    // Slagalica handlers
    private handleCheckWord(socket: Socket, { gameId, word }: SlagalicaCheckEvent): void {
        try {
            const game = this.getGame(gameId);
            if (!game) {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Game not found");
                return;
            }

            const validatedWord = game.validateSlagalica(word);
            socket.emit("wordCheckResult", validatedWord);
        } catch (error) {
            console.error("Error in handleCheckWord:", error);
            socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Failed to check word");
        }
    }

    private handleSendSlagalicaScore(socket: Socket, { gameId, word }: SlagalicaSubmitEvent): void {
        try {
            const game = this.getGame(gameId);
            if (!game) {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Game not found");
                return;
            }

            const validatedWord = game.validateSlagalica(word);
            game.addScore(GAME_KEYS.SLAGALICA, socket.id, validatedWord.score);
            console.log(`Submitted Slagalica score: ${validatedWord.score}`);

            socket.emit(SOCKET_EVENTS.GAMES.SLAGALICA.SUCCESS, { data: validatedWord.score });
            this.io.to(gameId).emit(SOCKET_EVENTS.STATE.PLAYERS_STATE, game);
        } catch (error) {
            console.error("Error in handleSendSlagalicaScore:", error);
            socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Failed to submit score");
        }
    }

    // Skocko handlers
    private handleCheckSkocko(socket: Socket, { gameId, cardComb }: SkockoCheckEvent): void {
        try {
            const game = this.getGame(gameId);
            if (!game) {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Game not found");
                return;
            }

            const validateSkocko = game.validateSkocko(cardComb);

            if (validateSkocko.correctPositions === 4) {
                game.addScore(GAME_KEYS.SKOCKO, socket.id, validateSkocko.score);
                socket.emit(SOCKET_EVENTS.GAMES.SKOCKO.SUCCESS, { data: validateSkocko.score });
                this.io.to(gameId).emit(SOCKET_EVENTS.STATE.PLAYERS_STATE, game);
            }

            socket.emit(SOCKET_EVENTS.GAMES.SKOCKO.RESULT, validateSkocko);
        } catch (error) {
            console.error("Error in handleCheckSkocko:", error);
            socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Failed to check Skocko");
        }
    }

    private handleSubmitSkocko(socket: Socket, { gameId, cardComb }: SkockoSubmitEvent): void {
        try {
            const game = this.getGame(gameId);
            if (!game) {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Game not found");
                return;
            }

            const validateSkocko = game.validateSkocko(cardComb);
            game.addScore(GAME_KEYS.SKOCKO, socket.id, validateSkocko.score);
            socket.emit("scoreSubmitedSkocko", { data: validateSkocko.score });
            this.io.to(gameId).emit(SOCKET_EVENTS.STATE.PLAYERS_STATE, game);
        } catch (error) {
            console.error("Error in handleSubmitSkocko:", error);
            socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Failed to submit score");
        }
    }

    // Spojnice handler
    private handleSubmitSpojnice(
        socket: Socket,
        { gameId, correctPick }: SpojniceSubmitEvent
    ): void {
        try {
            const game = this.getGame(gameId);
            if (!game) {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Game not found");
                return;
            }

            const validateSpojnice = game.validateSpojnice(correctPick);
            game.addScore(GAME_KEYS.SPOJNICE, socket.id, validateSpojnice);
            socket.emit("scoreSubmitedSpojnice", { data: validateSpojnice });
            this.io.to(gameId).emit(SOCKET_EVENTS.STATE.PLAYERS_STATE, game);
        } catch (error) {
            console.error("Error in handleSubmitSpojnice:", error);
            socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Failed to submit score");
        }
    }

    // Ko Zna Zna handlers
    private handleSubmitKoznazna(socket: Socket, { gameId, points }: KoZnaZnaSubmitEvent): void {
        try {
            const game = this.getGame(gameId);
            if (!game) {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Game not found");
                return;
            }

            const numericPoints = Number(points);
            if (isNaN(numericPoints)) {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Invalid points value");
                return;
            }

            game.addScore(GAME_KEYS.KO_ZNA_ZNA, socket.id, numericPoints);
            this.io.to(gameId).emit(SOCKET_EVENTS.STATE.PLAYERS_STATE, game);
            const player = game.getPlayer(socket.id);
            if (!player) return;

            socket.emit(SOCKET_EVENTS.GAMES.KO_ZNA_ZNA.ADD_POINTS, {
                data: player.score.games.koZnaZna.score,
            });
        } catch (error) {
            console.error("Error in handleSubmitKoznazna:", error);
            socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Failed to submit score");
        }
    }

    private handleEndKoznazna(socket: Socket, { gameId }: GameIdEvent): void {
        try {
            const game = this.getGame(gameId);
            if (!game) {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Game not found");
                return;
            }

            const player = game.getPlayer(socket.id);
            if (!player) return;
            socket.emit(SOCKET_EVENTS.GAMES.KO_ZNA_ZNA.SUCCESS, {
                data: player.score.games.koZnaZna.score,
            });
            this.io.to(gameId).emit(SOCKET_EVENTS.STATE.PLAYERS_STATE, game);
        } catch (error) {
            console.error("Error in handleEndKoznazna:", error);
            socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Failed to end game");
        }
    }

    // Asocijacije handler
    private handleSubmitAsocijacije(
        socket: Socket,
        { gameId, points }: AsocijacijeSubmitEvent
    ): void {
        try {
            const game = this.getGame(gameId);
            if (!game) {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Game not found");
                return;
            }

            const numericPoints = Number(points);
            if (isNaN(numericPoints)) {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Invalid points value");
                return;
            }

            game.addScore(GAME_KEYS.ASOCIJACIJE, socket.id, numericPoints);
            this.io.to(gameId).emit(SOCKET_EVENTS.STATE.PLAYERS_STATE, game);
            const player = game.getPlayer(socket.id);
            if (!player) return;

            socket.emit("scoreSubmitedAsocijacije", {
                data: player.score.games.asocijacije.score,
            });
        } catch (error) {
            console.error("Error in handleSubmitAsocijacije:", error);
            socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Failed to submit score");
        }
    }

    // Moj Broj handler
    private handleSubmitMojBroj(socket: Socket, { gameId, combination }: MojBrojSubmitEvent): void {
        try {
            const game = this.getGame(gameId);
            if (!game) {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Game not found");
                return;
            }

            const validateMojBroj = game.validateMojBroj(combination);
            game.addScore(GAME_KEYS.MOJ_BROJ, socket.id, validateMojBroj);
            socket.emit(SOCKET_EVENTS.GAMES.MOJ_BROJ.SUCCESS, { data: validateMojBroj });
            this.io.to(gameId).emit(SOCKET_EVENTS.STATE.PLAYERS_STATE, game);
        } catch (error) {
            console.error("Error in handleSubmitMojBroj:", error);
            socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Failed to submit score");
        }
    }

    private handleLeaveGame(socket: Socket): void {
        try {
            const gameId = this.findGameByPlayerId(socket.id);
            if (!gameId) {
                console.log(`No game found for player ${socket.id}`);
                return;
            }

            const game = this.games[gameId];
            const otherPlayer = game.players.find((p) => p.id !== socket.id);

            game.removePlayer(socket.id);
            socket.leave(gameId);
            console.log(`${gameId} left the game`);

            if (otherPlayer) {
                if (game.finishedPlayers.has(otherPlayer.id)) {
                    // Remaining player was in the waiting state — send final result
                    const finalScore = game.checkWinner();
                    this.io
                        .to(otherPlayer.id)
                        .emit(SOCKET_EVENTS.STATE.GAME_COMPLETED, { data: finalScore });
                } else {
                    this.io
                        .to(otherPlayer.id)
                        .emit(SOCKET_EVENTS.CORE.OPPONENT_LEFT, "Opponent left the game");
                }
            } else {
                this.cleanupGame(gameId);
            }
        } catch (error) {
            console.error("Error in handleLeaveGame:", error);
        }
    }

    private handleDisconnect(socket: Socket, reason: string): void {
        console.log(`${socket.id} disconnected: ${reason}`);

        try {
            const gameId = this.findGameByPlayerId(socket.id);
            if (!gameId) return;

            const game = this.games[gameId];
            const otherPlayer = game.players.find((p) => p.id !== socket.id);

            if (otherPlayer) {
                if (game.finishedPlayers.has(otherPlayer.id)) {
                    // Remaining player was waiting for this player — send final result
                    const finalScore = game.checkWinner();
                    this.io
                        .to(otherPlayer.id)
                        .emit(SOCKET_EVENTS.STATE.GAME_COMPLETED, { data: finalScore });
                } else {
                    this.io
                        .to(otherPlayer.id)
                        .emit(SOCKET_EVENTS.CORE.OPPONENT_LEFT, "Opponent left the game");
                }
            } else {
                this.cleanupGame(gameId);
            }
        } catch (error) {
            console.error("Error in handleDisconnect:", error);
        }
    }

    private handleReconnect(socket: Socket, { gameId, name }: ReconnectEvent): void {
        try {
            const game = this.getGame(gameId);
            if (!game) {
                socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Game not found");
                return;
            }

            // Try to find player by name and update their socket id
            const existingPlayer = game.players.find((p) => p.name === name);
            if (existingPlayer) {
                existingPlayer.id = socket.id;
                socket.join(gameId);
                console.log(`Player ${name} reconnected to game ${gameId} as ${socket.id}`);

                // Send updated state to the reconnected socket and room
                socket.emit(SOCKET_EVENTS.STATE.PLAYERS_STATE, game);
                socket.emit(SOCKET_EVENTS.STATE.GAME_DATA, game.gameState);
                this.io.to(gameId).emit(SOCKET_EVENTS.STATE.PLAYERS_STATE, game);
                return;
            }

            // If player not found, try to add them if there's space
            if (game.players.length < 2) {
                game.addPlayer(socket.id, name);
                socket.join(gameId);
                console.log(`Player ${name} rejoined (new slot) game ${gameId}`);
                socket.emit(SOCKET_EVENTS.STATE.PLAYERS_STATE, game);
                this.io.to(gameId).emit(SOCKET_EVENTS.STATE.PLAYERS_STATE, game);
                if (game.isReady()) {
                    this.io.to(gameId).emit(SOCKET_EVENTS.STATE.START_GAME, { game });
                }
                return;
            }

            socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Room is full");
        } catch (error) {
            console.error("Error in handleReconnect:", error);
            socket.emit(SOCKET_EVENTS.STATE.NOTIFICATION, "Failed to reconnect");
        }
    }

    // Helper methods
    private determineGameId(game: string | null): string {
        if (game !== null) {
            return game;
        }

        if (this.clientNo === 0) {
            this.tempGame = this.createGameId();
            this.clientNo++;
            return this.tempGame;
        } else {
            this.clientNo = 0;
            return this.tempGame!;
        }
    }

    private getOrCreateGame(gameId: string): Game {
        if (!this.games[gameId]) {
            this.games[gameId] = new Game(gameId);
        }
        return this.games[gameId];
    }

    private getGame(gameId: string): Game | null {
        return this.games[gameId] || null;
    }

    private isSinglePlayerGame(gameId: string): boolean {
        return gameId.slice(0, 2) === "sg";
    }

    private findGameByPlayerId(playerId: string): string | null {
        for (const gameId in this.games) {
            const game = this.games[gameId];
            if (game.players.some((player) => player.id === playerId)) {
                return gameId;
            }
        }
        return null;
    }

    private cleanupGame(gameId: string): void {
        if (gameId === this.tempGame) {
            this.tempGame = null;
            this.clientNo = 0;
        }
        delete this.games[gameId];
        console.log(`Game ${gameId} deleted`);
    }

    private createGameId(isSingleGame: boolean = false): string {
        const gid = () => Math.floor(Math.random() * 900) + 99;
        if (isSingleGame) {
            return `sg${gid()}-${gid()}-${gid()}`;
        }
        return `${gid()}-${gid()}-${gid()}`;
    }

    // Public method to get server stats if needed
    public getStats(): { activeGames: number; totalPlayers: number } {
        const activeGames = Object.keys(this.games).length;
        const totalPlayers = Object.values(this.games).reduce(
            (sum, game) => sum + game.players.length,
            0
        );
        return { activeGames, totalPlayers };
    }
}

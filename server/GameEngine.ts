import { srDictCapital } from "./data/sr-latin-capital-dict.js";
import { spojniceCombDb } from "./data/spojnice-comb-db.js";
import { asocijacijeDB } from "./data/asocijacije-db.js";
import { koznaznaDB } from "./data/koznazna-db.js";

export class Game {
    gameId: string;
    players: any[];
    gameState: any;
    gameCompleted: boolean;
    finishedPlayers: Set<string>;

    constructor(gameId: string) {
        this.gameId = gameId;
        this.players = [];
        this.finishedPlayers = new Set();
        this.gameState = {
            slagalica: this.createSlagalica(),
            mojBroj: this.createMojBroj(),
            spojnice: this.createSpojnice(),
            skocko: this.createSkocko(),
            koznazna: this.createKoznazna(),
            asocijacije: this.createAsocijacije(),
        };
        this.gameCompleted = false;
    }

    addPlayer(id: string, name: string) {
        if (this.players.length < 2) {
            const playerScore = {
                games: {
                    slagalica: { opend: false, score: 0 },
                    mojBroj: { opend: false, score: 0 },
                    spojnice: { opend: false, score: 0 },
                    skocko: { opend: false, score: 0 },
                    koZnaZna: { opend: false, score: 0 },
                    asocijacije: { opend: false, score: 0 },
                },
                get total() {
                    return Object.values(this.games).reduce((total, game) => total + game.score, 0);
                },
            };
            this.players.push({ id, name, score: playerScore });
            return true;
        }
        return false;
    }

    removePlayer(id: string) {
        this.players = this.players.filter((player) => player.id !== id);
    }

    getPlayer(id: string) {
        return this.players.find((player) => player.id === id);
    }

    isReady() {
        return this.players.length === 2;
    }

    handleOpendGame(gameKey: string, playerId: string) {
        this.players.forEach((player) => {
            if (player.id === playerId) {
                player.score.games[gameKey].opend = true;
            }
        });
    }

    addScore(gameKey: string, playerId: string, score: number) {
        this.players.forEach((player) => {
            if (player.id === playerId) {
                player.score.games[gameKey].score += score;
            }
        });
    }

    markPlayerFinished(playerId: string): void {
        this.finishedPlayers.add(playerId);
    }

    bothPlayersFinished(): boolean {
        return this.players.length >= 2 && this.players.every((p) => this.finishedPlayers.has(p.id));
    }

    isCompleted() {
        let completed = true;
        this.players.forEach((e) => {
            Object.values(e.score.games).forEach((g: any) => {
                if (!g.opend) {
                    completed = false;
                }
            });
        });
        this.gameCompleted = completed;
        return completed;
    }

    checkWinner() {
        let winner = this.players[0];
        let loser = this.players[1] || null;
        let draw = false;

        if (this.players[1] && this.players[1].score.total > this.players[0].score.total) {
            winner = this.players[1];
            loser = this.players[0];
        } else if (this.players[1] && this.players[1].score.total === this.players[0].score.total) {
            draw = true;
        }

        return {
            winnerPlayer: { id: winner.id, score: winner.score.total, name: winner.name },
            loser: loser ? { id: loser.id, score: loser.score.total, name: loser.name } : null,
            draw,
        };
    }

    createSlagalica() {
        const letters = [
            "A",
            "B",
            "C",
            "Č",
            "Ć",
            "D",
            "Đ",
            "E",
            "F",
            "G",
            "H",
            "I",
            "J",
            "K",
            "L",
            "LJ",
            "M",
            "N",
            "NJ",
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
        const getRandomLongWord = (arr: string[]) => {
            while (true) {
                const word = arr[Math.floor(Math.random() * arr.length)];
                if (word.length > 8 && word.length < 13) {
                    return word;
                }
            }
        };
        const getRandowLetter = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);

        const wordCombination = () => {
            const maxLen = 12;
            const word = getRandomLongWord(srDictCapital);
            const letterComb = [];
            letterComb.push(word.split(""));
            for (let i = word.length; i < maxLen; i++) {
                letterComb.push(getRandowLetter(letters));
            }
            return { word, letterComb: shuffle(letterComb.flat()) };
        };
        return wordCombination();
    }

    validateSlagalica(str: string) {
        const isValid = srDictCapital.includes(str);
        const score = isValid ? str.length * 2 : 0;
        return { validated: isValid, score };
    }

    createSkocko() {
        const skockoComb = [];
        const createRandIndex = () => Math.floor(Math.random() * 6);
        for (let i = 0; i < 4; i++) {
            skockoComb.push(createRandIndex());
        }
        return skockoComb;
    }

    validateSkocko(inputComb: number[]) {
        const correctComb = this.gameState.skocko;
        let correctNumbers = 0;
        let correctPositions = 0;
        let score = 0;

        const correctCombCopy = [...correctComb];
        if (inputComb) {
            inputComb.forEach((num, index) => {
                if (num === correctComb[index]) {
                    correctPositions++;
                    correctCombCopy[index] = null;
                    score += 3;
                }
            });
            inputComb.forEach((num, index) => {
                if (num !== correctComb[index] && correctCombCopy.includes(num)) {
                    correctNumbers++;
                    correctCombCopy[correctCombCopy.indexOf(num)] = null;
                    score += 3;
                }
            });
            if (correctPositions === 4) score = 30;
        }

        return { correctNumbers, correctPositions, score };
    }

    createSpojnice() {
        const randomSpojnica = spojniceCombDb[Math.floor(Math.random() * spojniceCombDb.length)];
        const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);

        const firstElementsWithIds: any[] = [];
        const seenIds = new Set();
        const remainingElements: any[] = [];

        randomSpojnica.set.forEach((elem) => {
            if (elem.id && !seenIds.has(elem.id)) {
                firstElementsWithIds.push(elem);
                seenIds.add(elem.id);
            } else {
                remainingElements.push(elem);
            }
        });

        const shuffledRemainingElements = shuffle(remainingElements);

        const resultSet = [];
        const specifiedIndices = [0, 2, 4, 6, 8, 10, 12, 14];
        let remainingIndex = 0;

        specifiedIndices.forEach((index, i) => {
            if (i < firstElementsWithIds.length) {
                resultSet[index] = firstElementsWithIds[i];
            }
        });

        for (let i = 0; i < resultSet.length; i++) {
            if (!resultSet[i]) {
                resultSet[i] = shuffledRemainingElements[remainingIndex++];
            }
        }

        while (remainingIndex < shuffledRemainingElements.length) {
            resultSet.push(shuffledRemainingElements[remainingIndex++]);
        }

        return {
            title: randomSpojnica.title,
            set: resultSet,
        };
    }

    validateSpojnice(d: number) {
        return d * 4;
    }

    createKoznazna() {
        const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);
        const pool = shuffle([...koznaznaDB]);
        return pool.slice(0, 10).map((q) => ({
            question: q.question,
            answer: q.answer,
            wrong: q.wrong,
        }));
    }

    createAsocijacije() {
        const randomAsocijacija = asocijacijeDB[Math.floor(Math.random() * asocijacijeDB.length)];

        return {
            asocijacija: randomAsocijacija,
        };
    }

    createMojBroj() {
        const target = Math.floor(Math.random() * 900) + 100;

        const operations = ["+", "-", "*", "/"];
        const mediumNimbers = [10, 15, 20];
        const largeNumbers = [25, 50, 75, 100];
        const numbers = [];
        for (let i = 0; i < 6; i++) {
            numbers.push(Math.floor(Math.random() * 9) + 1);
        }
        numbers.push(mediumNimbers[Math.floor(Math.random() * mediumNimbers.length)]);
        numbers.push(largeNumbers[Math.floor(Math.random() * largeNumbers.length)]);

        //const solution = "123"
        const solution = this.solveMojBroj(numbers, target);

        return { target, numbers, solution };
    }

    validateMojBroj(combination: string) {
        const target = this.gameState.mojBroj.target;
        console.log(combination);

        let points = 0;

        const safeEval = (expression: string) => {
            try {
                const result = eval(expression);
                return result;
            } catch (error) {
                console.error(error);
                return null;
            }
        };

        const evaluation = safeEval(combination);
        if (evaluation === target) {
            points = 30;
        } else if (Math.abs(target - evaluation) < 5) {
            points = 20;
        } else if (Math.abs(target - evaluation) < 10) {
            points = 10;
        } else {
            points = 0;
        }
        return points;
    }

    solveMojBroj(numbers: number[], target: number) {
        return "Nemamo broj Trenutno"
        let bestSolution = null;
        let closestDiff = Infinity;
        const memo = new Map();
        const startTime = Date.now();
        const timeLimit = 3000;

        function backtrack(currentNumbers: number[], expressions: string[]) {
            if (Date.now() - startTime > timeLimit) {
                return "Nemamo rešenje";
            }

            const key = currentNumbers
                .slice()
                .sort((a, b) => a - b)
                .join(",");
            if (memo.has(key)) {
                return;
            }

            if (currentNumbers.includes(target)) {
                bestSolution = `${target}`;
                closestDiff = 0;
                return;
            }

            if (currentNumbers.length === 1) {
                const result = currentNumbers[0];
                const diff = Math.abs(target - result);

                if (diff < closestDiff) {
                    closestDiff = diff;
                    bestSolution = expressions[0];
                }

                memo.set(key, { result, expressions });
                return;
            }

            const seen = new Set();

            for (let i = 0; i < currentNumbers.length; i++) {
                for (let j = i + 1; j < currentNumbers.length; j++) {
                    const a = currentNumbers[i];
                    const b = currentNumbers[j];

                    const nextNumbers = currentNumbers.filter(
                        (_, index) => index !== i && index !== j
                    );
                    const nextExpressions = expressions.filter(
                        (_, index) => index !== i && index !== j
                    );

                    const operations = [
                        { result: a + b, expr: `(${expressions[i]} + ${expressions[j]})` },
                        { result: a - b, expr: `(${expressions[i]} - ${expressions[j]})` },
                        { result: b - a, expr: `(${expressions[j]} - ${expressions[i]})` },
                        { result: a * b, expr: `(${expressions[i]} * ${expressions[j]})` },
                    ];

                    if (b !== 0 && a % b === 0) {
                        operations.push({
                            result: a / b,
                            expr: `(${expressions[i]} / ${expressions[j]})`,
                        });
                    }
                    if (a !== 0 && b % a === 0) {
                        operations.push({
                            result: b / a,
                            expr: `(${expressions[j]} / ${expressions[i]})`,
                        });
                    }

                    for (const op of operations) {
                        if (op.result > 0 && !seen.has(op.result)) {
                            seen.add(op.result);

                            if (op.result === target) {
                                bestSolution = op.expr;
                                closestDiff = 0;
                                return;
                            }

                            backtrack([...nextNumbers, op.result], [...nextExpressions, op.expr]);
                        }
                    }
                }
            }

            memo.set(key, { result: null, expressions });
        }

        const expressions = numbers.map((num) => num.toString());
        backtrack(numbers, expressions);

        if (bestSolution) {
            return `${bestSolution} = ${eval(bestSolution)}`;
        } else {
            return "Nema rešenja";
        }
    }
}

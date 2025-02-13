import {srDictCapital} from "../db/sr-latin-capital-dict.js"
import { spojniceCombDb } from "../db/spojnice-comb-db.js";
import { initialize } from "@paunovic/questionnaire";
import { asocijacijeDB } from "../db/asocijacije-db.js";
export class Game {
    constructor(gameId) {
        this.gameId = gameId;
        this.players = [];
        this.gameState = {
            slagalica: this.createSlagalica(),
            mojBroj: this.createMojBroj(),
            spojnice: this.createSpojnice(),
            skocko: this.createSkocko(),
            koZnaZna: this.createKoznazna(),
            asocijacije:this.createAsocijacije()
        };
        this.gameCompleted = false;
    }

    addPlayer(id, name) {
        if (this.players.length < 2) {

            const playerScore = {
                games:{ 
                    slagalica:{opend:false,score:0},
                    mojBroj:{opend:false,score:0},
                    spojnice:{opend:false,score:0},
                    skocko:{opend:false,score:0},
                    koZnaZna:{opend:false,score:0},
                    asocijacije:{opend:false,score:0}
                },
                get total() {
                    return Object.values(this.games).reduce((total, game) => total + game.score, 0);
                }
            }
            this.players.push({ id, name,score:playerScore });
            return true;
        }
        return false; 
    }
    removePlayer(id) {
        this.players = this.players.filter((player) => player.id !== id);
    }
    getPlayer(id) {
        return this.players.find((player) => player.id === id);
    }
    isReady() {
        return this.players.length === 2;
    }
    handleOpendGame(gameKey,playerId){
        this.players.forEach(player => {
            if(player.id === playerId){
                player.score.games[gameKey].opend = true
            }
        })
    }
    addScore(gameKey,playerId,score){
        this.players.forEach(player => {
            if(player.id === playerId){
                
                player.score.games[gameKey].score += score
               console.log(this.players[0].score.games[gameKey]);
               console.log(this.players[1].score.games[gameKey]);
               
            }
        })
    }
    createSlagalica(){
        const letters = ["A","B","C","Č","Ć","D","Đ","E","F","G","H","I","J","K","L","LJ","M","N","NJ","O","P","R","S","Š","T","U","V","Z","Ž"]
        const getRandomLongWord = (arr) => {
            while(true){
                const word = arr[Math.floor(Math.random() * arr.length)]
                if(word.length > 8 && word.length < 13){
                    return word
                }
            }
        }
        const getRandowLetter = (arr) =>  arr[Math.floor(Math.random () * arr.length)]
        const shuffle = (arr) => arr.sort(() => Math.random() - 0.5)    
        
        const wordCombination = () => {
            const maxLen = 12
            const word = getRandomLongWord(srDictCapital)
            const letterComb = []
            letterComb.push(word.split(""))
            for(let i = word.length; i < maxLen; i++){
                letterComb.push(getRandowLetter(letters))
            }
            return {word,letterComb:shuffle(letterComb.flat())}
        }
        return wordCombination()
    }
    validateSlagalica(str) {
        const isValid = srDictCapital.includes(str);
        const score = isValid ? str.length * 2 : 0; 
        return { validated: isValid, score };
    }
    createSkocko(){
        const skockoComb = []
        const createRandIndex = () => Math.floor(Math.random () *6)
        for(let i = 0; i < 4; i++){
            skockoComb.push(createRandIndex())
        }
        return skockoComb
    }
    validateSkocko(inputComb){
        const correctComb = this.gameState.skocko
        let correctNumbers = 0
        let correctPositions = 0
        let score = 0

        const correctCombCopy = [...correctComb]
        if(inputComb){
            inputComb.forEach((num,index) => {
                if(num === correctComb[index]){
                    correctPositions ++
                    correctCombCopy[index] = null
                    score += 3
                }
            })
            inputComb.forEach((num,index) => {
                if(num !== correctComb[index] && correctCombCopy.includes(num)){
                    correctNumbers ++
                    correctCombCopy[correctCombCopy.indexOf(num)] = null
                    score += 3
                }
            })
            if(correctPositions === 4) score = 30
        }

        return {correctNumbers,correctPositions,score}
    }
    createSpojnice() {
        const randomSpojnica = spojniceCombDb[Math.floor(Math.random() * spojniceCombDb.length)];
        const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
    
        const firstElementsWithIds = [];
        const seenIds = new Set();
        const remainingElements = [];
    
        randomSpojnica.set.forEach(elem => {
            if (elem.id && !seenIds.has(elem.id)) {
                firstElementsWithIds.push(elem);
                seenIds.add(elem.id);
            } else {
                remainingElements.push(elem);
            }
        });
    
        const shuffledRemainingElements = shuffle(remainingElements);
    
        const resultSet = [];
        const specifiedIndices = [0, 2, 4, 6, 8, 10,12,14];
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
            set: resultSet
        };
    }
    validateSpojnice(d){
        return d * 4
    }
    createKoznazna(){
        const QUESTIONNAIRE = initialize(); 
        const Q4 = QUESTIONNAIRE.questions({ howMany: 10, wrong: 2 });
        console.log(Q4);
        
        return Q4
    }
    createAsocijacije(){

        
        const randomAsocijacija = asocijacijeDB[Math.floor(Math.random() * asocijacijeDB.length)];
        console.log(randomAsocijacija);
        
        return {
            asocijacija:randomAsocijacija
        };
    }
    createMojBroj(){
        const target = Math.floor(Math.random() * 900) + 100;

        const operations = ["+", "-", "*", "/"];
        const mediumNimbers = [10,15,20]
        const largeNumbers = [25,50,75,100]
        const numbers = [];
        for (let i = 0; i < 6; i++) {
            numbers.push(Math.floor(Math.random() * 9) + 1);
        }
        numbers.push(mediumNimbers[Math.floor(Math.random() * mediumNimbers.length)])
        numbers.push(largeNumbers[Math.floor(Math.random() * largeNumbers.length)])

        //const solution = "123"
        const solution = this.solveMojBroj(numbers,target)

        return {target, numbers,solution}
    }
    validateMojBroj(combination) {
        const target = this.gameState.mojBroj.target;
        console.log(combination);
        
    
        let points = 0;
    
        const safeEval = (expression) => {
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
    solveMojBroj(numbers, target) {
        let bestSolution = null;
        let closestDiff = Infinity;
        const memo = new Map();
        const startTime = Date.now();
        const timeLimit = 5000; // 5 seconds
    
        function backtrack(currentNumbers, expressions) {
            if (Date.now() - startTime > timeLimit) {
                return "Nemamo rešenje"; 
            }
    
            const key = currentNumbers.slice().sort((a, b) => a - b).join(",");
            if (memo.has(key)) {
                return;
            }
    
            if (currentNumbers.includes(target)) {
                bestSolution = `${target}`;
                closestDiff = 0;
                return;
            }
    
            if (currentNumbers.length === 1) {
                let result = currentNumbers[0];
                let diff = Math.abs(target - result);
    
                if (diff < closestDiff) {
                    closestDiff = diff;
                    bestSolution = expressions[0];
                }
    
                memo.set(key, { result, expressions });
                return;
            }
    
            let seen = new Set();
    
            for (let i = 0; i < currentNumbers.length; i++) {
                for (let j = i + 1; j < currentNumbers.length; j++) {
                    let a = currentNumbers[i];
                    let b = currentNumbers[j];
    
                    let nextNumbers = currentNumbers.filter((_, index) => index !== i && index !== j);
                    let nextExpressions = expressions.filter((_, index) => index !== i && index !== j);
    
                    let operations = [
                        { result: a + b, expr: `(${expressions[i]} + ${expressions[j]})` },
                        { result: a - b, expr: `(${expressions[i]} - ${expressions[j]})` },
                        { result: b - a, expr: `(${expressions[j]} - ${expressions[i]})` },
                        { result: a * b, expr: `(${expressions[i]} * ${expressions[j]})` }
                    ];
    
                    if (b !== 0 && a % b === 0) {
                        operations.push({ result: a / b, expr: `(${expressions[i]} / ${expressions[j]})` });
                    }
                    if (a !== 0 && b % a === 0) {
                        operations.push({ result: b / a, expr: `(${expressions[j]} / ${expressions[i]})` });
                    }
    
                    for (let op of operations) {
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
    
        let expressions = numbers.map(num => num.toString());
        backtrack(numbers, expressions);
    
        if (bestSolution) {
            console.log(`${bestSolution} = ${eval(bestSolution)}`);
            return `${bestSolution} = ${eval(bestSolution)}`;
        } else {
            console.log("Nema tačnog rešenja.");
            return "Nema rešenja";
        }
    }
    
    
        
}

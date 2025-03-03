<!-- Project logo -->

<div style="text-align: center;">
    <img src="public/assets/owl_logo.png" alt="Slagalica Logo" width="150" height="150" style="display: block; margin: 0 auto;">
    <h1 style="font-size: 60px; text-align: center; margin-top: 10px;">Slagalica</h1>
</div>




Slagalica is a web-based game inspired by the Serbian TV quiz show "Slagalica." It lets users play mini-games in single-player or multiplayer mode.

## Live Demo

> [!IMPORTANT]  
> The application is deployed on Render.com using a free instance. Due to inactivity, the initial load may take up to 50 seconds. You can access the deployed project [here ](https://slagalica-demo.onrender.com).

Check out the live demo hosted on Render.com: [slagalica](https://slagalica-demo.onrender.com)
link: https://slagalica-demo.onrender.com

> [!WARNING]  
> ### **Getting the Best Experience**  
>Since this is a demo project, the server lobby may be empty when you try to join a random multiplayer game. To fully experience the multiplayer features, consider one of the following options:  
> - **Single Player Mode:** Play the game alone to explore its mechanics.  
> - **Testing Multiplayer:** Open two separate browser windows and join a random game from both. This way, you can simulate playing against another user.  
> - **Play With a Friend:** Use the **"Greate game/Play With Friend"** option to create a game room and share the generated code with a friend. They can enter the same code to join your game.  


## Gameplay modes

- **Single Player Mode**: Play the game alone and try to achieve the highest score.
- **Multiplayer Mode (Play random)**: Compete against other players in real-time. Players are matched in a random server room and the game begins when another player joins.
- **Multiplayer Against Friend Mode (Greate game/Play With Friend)**: Players have the option to join a specific room via a code generated in the create game menu and share it with a friend in order to join the same room.

<!-- - **Mini-Games**: Includes various mini-games such as:
  - **Slagalica**: A word game where players form as many words as possible from a given set of letters within a time limit.
  - **Moj Broj**: A numbers game where players use basic arithmetic operations to reach a target number using a given set of numbers.
  - **Spojnice**: A matching game where players connect related items from two columns.
  - **Skočko**: A logic game similar to Mastermind, where players guess a sequence of symbols within a limited number of attempts.
  - **Ko Zna Zna**: A trivia quiz game where players answer general knowledge questions.
  - **Asocijacije**: An association game where players guess a hidden word based on a series of related clues.
- **Real-Time Updates**: Uses WebSockets for real-time communication between players and the server. This includes real-time score updates, checking the game state, reviewing answers, and returning answers generated by the application. -->

## Games

Each round consists of six games played consecutively, with each game having a set duration and specific point value. The objective is to collect more points than your opponent and win the game.

Each mini-game is completed either when the time runs out or when the user submits their result. After each game, the user receives a notification about their score and can see the answer generated by the program.

Each game is explained separately below:

1. **Slagalica:**

   - A word game where players form the longest possible word from a given set of letters.
   - For each letter in the word, the player is awarded 2 points.
   - Players have an option to validate that their word is grammatically correct before submitting it.

2. **Moj Broj (My Number):**

   - A numbers game where players use basic arithmetic operations to reach a target number using a given set of numbers.
   - Players create an expression using 6 numbers and basic operations.
   - Points are awarded based on the correctness of the expression.

3. **Spojnice (Connections):**

   - Players connect five terms from the left column with terms from the right column based on a specified criterion.
   - Each connected term earns 4 points, totaling 32 points per round.

4. **Skočko:**

   - Players guess a sequence of 4 symbols within 6 attempts using a set of 6 symbols.
   - Points are awarded based on the number of attempts. If the player gets the correct combination, they are awarded 30 points.

5. **Ko Zna Zna (Who Knows, Knows):**

   - A general knowledge game with 10 questions, each having four possible answers.
   - Correct answers earn 3 points, while incorrect answers result in a deduction of 1 point.
   - The player has the option to skip a question without it affecting their total points.

6. **Asocijacije (Associations):**
   - Players associate four columns with hidden words or expressions that correspond to a solution in the fifth field.
   - Opening a field allows the player to guess the column or the final solution.
   - Each correctly guessed column is worth 5 points. If the player guesses all fields correctly, they are awarded 30 points.

## Technologies Used

The Slagalica application is a robust full-stack solution, featuring a responsive frontend built with vanilla JavaScript and a backend powered by Node.js and Express.js. Real-time interactions are handled using WebSockets (Socket.io), ensuring a smooth and engaging user experience. The application is unit tested using Jest to maintain high code quality and reliability. Continuous Integration and Continuous Deployment (CI/CD) pipelines are set up using GitHub Actions, which automatically run tests and deploy the application to Render.com upon successful test completion. This streamlined process ensures that updates are efficiently and reliably delivered to users.
The app is purposely built with basic technologies and minimal libraries for maintainability and to allow me to practice core JavaScript concepts.

## Getting Started

### Prerequisites

- Node.js installed on your machine.

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/your-username/slagalica_demo.git
   cd slagalica_demo

   ```

2. Install dependencies:

   ```sh
   npm install

   ```

3. Start the server:
   ```sh
   npm start
   ```

The server will start, and you should see a message indicating that the server is running.

4. Open the `slagalica_demo/public/js/app.js` folder:

   Change the socket variable

   - from:
     ```javaScript
        const socket = io("https://slagalica-demo.onrender.com")
     ```
   - to:
     ```javaScript
         const socket = io("ws://localhost:3500")
     ```

5. Navigate to `slagalica_demo/public/index.html` :
   Start live server

## Gameplay screenshots

![Image](https://github.com/user-attachments/assets/bed0c974-4daa-487a-b6a3-d78cb15f9f95)
![Image](https://github.com/user-attachments/assets/75261365-808f-41c0-aefc-2d15ac3e2f75)
![Image](https://github.com/user-attachments/assets/4b14b1ef-76e9-4bf6-a0ae-e4ba66eb2359)
![Image](https://github.com/user-attachments/assets/b3c72ec4-cea7-4544-933b-1a9e63275153)
![Image](https://github.com/user-attachments/assets/e33cbf6c-0e79-404f-8043-cd83d2ab31c0)
![Image](https://github.com/user-attachments/assets/eec468a3-e693-4753-a7f1-aaa089f12cde)
![Image](https://github.com/user-attachments/assets/f1952ea7-e2fa-4e98-886b-19f185ae0824)
![Image](https://github.com/user-attachments/assets/379c0a56-b9c9-4bea-8c6e-c61ed829b437)
![Image](https://github.com/user-attachments/assets/bb67daf9-8a3a-47db-9538-79df5ca6a312)
![Image](https://github.com/user-attachments/assets/172de3d6-698c-4d53-9e26-472d5f1134d5)

var XYZ = 3;

console.log("loading file now");

function startGameFinder() {
    let name = document.getElementById("nameField").value;
    console.log(name);
    document.getElementById("nameEntry").remove();
    new GameFinder(name);
}

class GameFinder {
    div;
    gameNumber;
    name;
    socket;

    constructor(name) {
        this.name = name;
        this.div = document.getElementById("gameFinder");
        this.div.innerHTML = "Finding Game...";
        this.socket = io();
        this.socket.emit("player-name", this.name);
        this.socket.on("open-games", list => this.showOpenGames(list));
        this.socket.on("joined", gameNumber => this.joinedGame(gameNumber));
        this.socket.on("game-started", playerNumber => this.gameStarted(playerNumber));
    }

    /**
     * Display games that are waiting for more players.
     *
     * @param obj A list of Javascript objects describing the games.
     */
    showOpenGames(games) {
        console.log(games);
        this.div.innerHTML = "Open games:";
        for (let game of games) {
            let table = document.createElement("table"); this.div.appendChild(table);
            table.classList = ["gameFinder"];
            table.id = "game-" + game.number;
            let headRow = document.createElement("tr"); table.appendChild(headRow);
            let titleCell = document.createElement("th"); headRow.appendChild(titleCell);
            titleCell.innerHTML = "Game " + game.number;
            for (let i = 0; i < 6; i++) {
                let row = document.createElement("tr"); table.appendChild(row);
                let cell = document.createElement("td"); row.appendChild(cell);
                let playerName = game.playerNames[i];
                if (playerName) {
                    cell.innerHTML = playerName;
                } else {
                    cell.innerHTML = "open slot";
                }
            }
            let row = document.createElement("tr"); table.appendChild(row);
            let cell = document.createElement("td"); row.appendChild(cell);
            let joinButton = document.createElement("button"); cell.appendChild(joinButton);
            joinButton.innerHTML = "Join game";
            joinButton.gameNumber = game.number;
            joinButton.onclick = (e => this.joinGame(e.target.gameNumber));
            if (this.gameNumber === game.number) {
                this.showStartButton(this.gameNumber, game.canStartYet);
            }
        }
        let addGameButton = document.createElement("button"); this.div.appendChild(addGameButton);
        addGameButton.innerHTML = "New game";
        addGameButton.onclick = () => this.addGame();
    }

    addGame() {
        this.socket.emit("add-game");
    }

    joinGame(number) {
        console.log("joining game", number);
        this.socket.emit("join", number);
    }

    startGame(number) {
        console.log("starting game", number);
        this.socket.emit("start", number);
    }

    joinedGame(gameNumber) {
        this.gameNumber = gameNumber;
    }

    showStartButton(gameNumber, canStartYet) {
        let joinButton = document.querySelector("#game-" + gameNumber + ">tr>td>button");// + ">tr>tr>button.joinButton");
        console.assert(joinButton != undefined);
        console.log(joinButton);
        joinButton.innerHTML = "Start game";
        joinButton.onclick = (e => this.startGame(e.target.gameNumber));
        joinButton.disabled = !canStartYet;
    }

    gameStarted(playerNumber) {
        console.log("socket", this.socket);
        controller = new Controller(new View(), this.socket, this.gameNumber, playerNumber);
    }
}

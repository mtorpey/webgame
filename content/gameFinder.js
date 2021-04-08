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
    name;
    socket;

    constructor(name) {
        this.name = name;
        this.div = document.getElementById("gameFinder");
        this.div.innerHTML = "Fubdubg gane...";
        this.socket = io();
        this.socket.emit("player-name", this.name);
        this.socket.on("open-games", list => this.showOpenGames(list));
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
            joinButton.addEventListener("click", e => this.joinGame(e.target.gameNumber));
        }
    }

    joinGame(number) {
        console.log("joining game", number);
        this.socket.emit("join", number);
    }
}

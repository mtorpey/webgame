const TurnPhase = {
    INITIAL_PLACEMENT: "initial placement",
    START_OF_TURN: "start",
    EXPANDING: "expanding",
    READY_TO_SAIL: "ready to sail",
    LANDING: "landing",
    GAME_OVER: "game over"
}

const ChangeType = {
    SHIP_ADDED: "ship added",
    NEXT_PLAYER: "next player",
    VALID_MOVES: "valid moves"
}

class Model {
    tiles;
    names;
    nrPlayers;
    currentPlayer;
    turnPhase;

    tonga;

    constructor(names) {
        // Setup players
        this.names = names;
        this.nrPlayers = names.length;
        console.assert(this.nrPlayers in [2,3,4,5,6]);
        this.currentPlayer = 0;
        this.turnPhase = TurnPhase.INITIAL_PLACEMENT;

        // Setup tiles
        //let tonga = new IslandTile("Tonga", 0, [new Beach([0], 2), new Beach([1, 2], 3), new Beach([3, 4, 5], 5)]);
        this.tonga = new IslandTile(
            "Tonga",
            0,
            [
                new Beach([0], 3),
                new Beach([1], 3),
                new Beach([2], 3),
                new Beach([3], 3),
                new Beach([4], 3),
                new Beach([5], 3)
            ]
        );
        this.tonga.place(2, 3, 0);
        this.tiles = [this.tonga];
    }

    initialPlacement(direction, slotNo) {
        this.tonga.addShip(direction, slotNo, this.currentPlayer);
        this.broadcastChange({
            type: ChangeType.SHIP_ADDED,
            col: this.tonga.col,
            row: this.tonga.row,
            direction: direction,
            slotNo: slotNo,
            playerNo: this.currentPlayer
        });

        this.currentPlayer++;
        this.currentPlayer %= this.nrPlayers;
        this.broadcastChange({
            type: ChangeType.NEXT_PLAYER,
            currentPlayer: this.currentPlayer
        });

        this.broadcastChange({
            type: ChangeType.VALID_MOVES,
            beachSlots: this.getValidMovesInitialPlacement()
        });
    }

    /**
     * List of valid slots for the current player to place a ship during initial placement.
     */
    getValidMovesInitialPlacement() {
        let validMoves = [];
        for (let b = 0; b < this.tonga.beaches.length; b++) {
            let beach = this.tonga.beaches[b];
            let sum = beach.ships.filter(x => x != null).length;
            if (sum < 2) {
                for (let slotNo = 0; slotNo < beach.capacity; slotNo++) {
                    if (beach.ships[slotNo] === null) {
                        validMoves.push({
                            col: this.tonga.col,
                            row: this.tonga.row,
                            direction: b,
                            slotNo: slotNo
                        });
                    }
                }
            }
        }
        return validMoves;
    }

    // Sending updates to the view
    // TODO: replace this with socket.io when model is server-side
    listener;
    registerChangeListener(listener) {
        this.listener = listener;
    }
    broadcastChange(obj) {
        this.listener.modelChanged(obj);
    }
}

class Tile {
    row;
    col;
    rotation;

    place(row, col, rotation) {
        this.row = row;
        this.col = col;
        this.rotation = rotation;
    }
}

class IslandTile extends Tile {
    name;
    value;
    beaches;

    /**
     * Creates an island tile, but doesn't place it.
     *
     * @param {string} name Name of the island, e.g. "Tonga".
     * @param {int} value How many points this is worth at end of game.
     * @param {list of Beach objects} beaches on the island
     */
    constructor(name, value, beaches) {
        super();
        this.name = name;
        this.value = value;
        this.beaches = beaches;
    }

    addShip(direction, slotNo, playerNo) {
        this.beaches[direction].addShip(slotNo, playerNo);
    }
}

class SeaTile extends Tile {
    exits;

    /**
     * Creates a sea tile, but doesn't place it.
     *
     * @param {list of 6 ints} exits Direction you leave if you enter at edge i
     */
    constructor(exits) {
        super();
        // TODO: check these are symmetric?
        this.exits = exits;
    }

}

class Beach {
    exits;
    capacity;
    ships;

    /**
     * Creates an empty beach.
     *
     * @param {list of ints} exits Island edges that this beach's ships can use.
     * @param {int} capacity How many ships this beach can hold.
     */
    constructor(exits, capacity) {
        this.exits = exits;
        this.capacity = capacity;  // TODO: make getter?
        this.ships = [];
        for (let i = 0; i < capacity; i++) {
            this.ships.push(null);
        }
    }

    addShip(slotNo, playerNo) {
        console.assert(this.ships.length === this.capacity);
        console.assert(this.ships[slotNo] === null);
        this.ships[slotNo] = playerNo;
    }
}

function hexNeighbor(col, row, direction) {
    let isEven = (col % 2 == 0) ? -1 : 0;
    switch (direction) {
    case 0: row -= 1; break;
    case 1: col += 1; row += isEven; break;
    case 2: col += 1; row += 1 + isEven; break;            
    case 3: row += 1; break;
    case 4: col -= 1; row += 1 + isEven; break;
    case 5: col -= 1; row += isEven; break;
    }
    return {col: col, row: row};
}

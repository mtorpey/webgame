class Model {
    tiles;

    constructor() {
        let tonga = new IslandTile("Tonga", 0, [new Beach([0], 2), new Beach([1, 2], 3), new Beach([3, 4, 5], 5)]);
        //let tonga = new IslandTile("Tonga", 0, [new Beach([0], 3), new Beach([1], 3), new Beach([2], 3), new Beach([3], 3), new Beach([4], 3), new Beach([5], 3)]);
        tonga.place(2, 3, 0);
        this.tiles = [tonga];
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
        this.capacity = capacity;
        this.ships = [];
    }

    addShip(playerNo) {
        console.assert(this.ships.length < this.capacity);
        ships.push(playerNo);
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

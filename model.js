class Model {
    #tiles;

    constructor() {
        let tonga = new IslandTile("Tonga", 0, [new Beach([0], 2), new Beach([1, 2], 3), new Beach([3, 4, 5], 5)]);
        tonga.place(2, 3);
        this.#tiles = [tonga];
    }

    get tiles() {
        return this.#tiles;
    }
}

class Tile {
    row; col;

    place(row, col) {
        this.row = row;
        this.col = col;
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

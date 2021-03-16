class Model {
    #tiles;

    constructor() {
        let tonga = new Tile("Tonga", 0);
        tonga.place(2, 3);
        this.#tiles = [tonga];
    }

    get tiles() {
        return this.#tiles;
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

class Tile {
    name;
    value;
    row; col;

    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
    
    place(row, col) {
        this.row = row;
        this.col = col;
    }
}

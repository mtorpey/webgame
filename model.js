class Model {
    ship1 = new Ship(new Hex(1, 2), 3, 1, 4);

    get allShips() {
        return [this.ship1];
    }

    movementExecutionPhase(moveString) {
        // TODO: check legality
        // TODO: support multiple ships
        for (let i in moveString) {
            this.ship1.move(moveString[i]);
        }
    }
}

class Ship {
    #bowHex;
    #attitude;
    #nationality;
    #shipClass;
    
    constructor(bowHex, attitude, nationality, shipClass) {
        this.#bowHex = bowHex;
        this.#attitude = attitude;
        this.#nationality = nationality;
        this.#shipClass = shipClass;
    }

    get bowHex() { return this.#bowHex; }
    get sternHex() {
        let behind = ((this.#attitude - 1 + 3) % 6) + 1;
        return this.bowHex.neighbor(behind)
    }

    move(letter) {
        if (letter in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
            let n = parseInt(letter);
            for (let i = 0; i < n; i++) {
                this.moveForward();
            }
        } else if (letter == 'L') {
            this.turnLeft();
        } else if (letter == 'R') {
            this.turnRight();
        } else {
            console.log("Error: bad movement notation '" + letter + "'")
        }
    }

    moveForward() {
        this.#bowHex = this.#bowHex.neighbor(this.#attitude);
    }

    turnLeft() {
        if (this.#attitude == 1) {
            this.#attitude = 6
        } else {
            this.#attitude -= 1;
        }
    }

    turnRight() {
        if (this.#attitude == 6) {
            this.#attitude = 1
        } else {
            this.#attitude += 1;
        }
    }
}

class Hex {
    #col; #row;
    
    constructor(col, row) {
        this.#col = col;
        this.#row = row;
    }

    get col() {
        return this.#col;
    }
    get row() {
        return this.#row;
    }

    neighbor(direction) {
        let col = this.col;
        let row = this.row;
        let isEven = (this.col % 2 == 0) ? -1 : 0;
        switch (direction) {
            case 1: row -= 1; break;
            case 2: col += 1; row += isEven; break;
            case 3: col += 1; row += 1 + isEven; break;            
            case 4: row += 1; break;
            case 5: col -= 1; row += 1 + isEven; break;
            case 6: col -= 1; row += isEven; break;
        }
        return new Hex(col, row);
    }
}

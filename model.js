const TurnPhase = {
    INITIAL_PLACEMENT: "initial placement",  // place 2 ships each on Tonga
    START_OF_TURN: "start",  // choose an island to expand (or royal/special)
    EXPANDING: "expanding",  // choose the beaches to place your new ships
    READY_TO_SAIL: "ready to sail",  // choose a beach to sail from
    LANDING: "landing",  // choose which beaches the ships land on
    GAME_OVER: "game over"
}

const ChangeType = {
    SHIP_ADDED: "ship added",
    BEACH_EMPTIED: "beach emptied",
    ISLAND_SELECTED: "island selected",  // for expansion
    TILE_ADDED: "tile added",
    NEXT_PLAYER: "next player",
    VALID_MOVES: "valid moves"
}

class Model {
    tiles;
    tileSupply;
    names;
    nrPlayers;
    currentPlayer;
    turnPhase;

    tonga;

    expansionIsland;
    shipsToAddInExpansion;
    beachesAvailableForExpansion;

    sailingFleet;
    tileJustLeft;
    landingTile;
    landedOneOnEachBeach;

    constructor(names) {
        // Setup players
        this.names = names;
        this.nrPlayers = names.length;
        console.assert(this.nrPlayers in [2,3,4,5,6]);
        this.currentPlayer = 0;
        this.turnPhase = TurnPhase.INITIAL_PLACEMENT;

        // Setup tiles
        //let tonga = new IslandTile("Tonga", 0, [new Beach([0], 2), new Beach([1, 2], 3), new Beach([3, 4, 5], 5)]);
        this.tiles = [];
        this.tonga = new IslandTile("Tonga", 0, [
            new Beach([0], 3),
            new Beach([1], 3),
            new Beach([2], 3),
            new Beach([3], 3),
            new Beach([4], 3),
            new Beach([5], 3)
        ]);
        this.placeTile(3, 2, 0, this.tonga);

        // Tiles in the supply
        this.tileSupply = [
            new IslandTile("Fidschi", 5, [new Beach([5, 0], 4), new Beach([1, 2], 4), new Beach([4], 5)]),
            new IslandTile("Hawaii", 5, [new Beach([0], 5), new Beach([1, 2], 2), new Beach([4, 5], 3)]),
            new IslandTile("Hiva Oa", 4, [new Beach([0], 2), new Beach([1, 2], 5), new Beach([4, 5], 2)]),
            new IslandTile("Mangareva", 4, [new Beach([0, 1], 3), new Beach([2], 4), new Beach([4, 5], 2)]),
            new IslandTile("Muroroa", 2, [new Beach([1, 2], 3), new Beach([4], 2), new Beach([5], 2)]),
            new IslandTile("Nauru", 2, [new Beach([0], 3), new Beach([1, 2], 2), new Beach([4, 5], 2)]),
            new IslandTile("Oahu", 4, [new Beach([0], 5), new Beach([1, 2], 3), new Beach([4, 5], 3)]),
            new IslandTile("Rapa Nui", 3, [new Beach([0, 1, 2], 3), new Beach([4, 5], 5)]),
            new IslandTile("Rarotonga", 3, [new Beach([0, 1, 2], 4), new Beach([4, 5], 3)]),
            new IslandTile("Samoa", 5, [new Beach([0, 1], 4), new Beach([2], 5), new Beach([4, 5], 3)]),
            new IslandTile("Tahiti", 4, [new Beach([0, 1], 3), new Beach([2], 4), new Beach([4, 5], 2)]),
            new IslandTile("Tokelau", 3, [new Beach([5, 0], 3), new Beach([1, 2], 2), new Beach([4], 4)]),
            new IslandTile("Tuamotu", 3, [new Beach([4, 5, 0], 4), new Beach([1, 2], 4)]),
            new IslandTile("Tubuai", 2, [new Beach([1, 2], 3), new Beach([4, 5], 3)]),
            new IslandTile("Tuvalu", 4, [new Beach([0], 4), new Beach([1, 2], 3), new Beach([4, 5], 2)])
        ];
        this.tileSupply = this.tileSupply.sort(() => Math.random() - 0.5);
    }

    placeTile(col, row, rotation, tile) {
        tile.place(col, row, rotation);
        this.tiles.push(tile);
    }

    placeRandomTile(col, row, rotation) {
        let tile = this.tileSupply.pop();
        console.assert(tile);
        this.placeTile(col, row, rotation, tile);
    }

    initialPlacement(beachNo, slotNo) {
        console.assert(this.turnPhase === TurnPhase.INITIAL_PLACEMENT);

        // Add the ship
        this.tonga.addShip(beachNo, slotNo, this.currentPlayer);
        this.broadcastChange({
            type: ChangeType.SHIP_ADDED,
            col: this.tonga.col,
            row: this.tonga.row,
            beachNo: beachNo,
            slotNo: slotNo,
            playerNo: this.currentPlayer
        });

        // Advance player turn
        this.nextPlayer();

        // Is initial placement done?
        if (this.tonga.nrShipsOnTile(this.currentPlayer) === 2) {
            this.turnPhase = TurnPhase.START_OF_TURN;
        }

        // Broadcast valid moves
        this.broadcastChange(this.getValidMoves());
    }

    nextPlayer() {
        // Advance player turn
        this.currentPlayer++;
        this.currentPlayer %= this.nrPlayers;
        this.broadcastChange({
            type: ChangeType.NEXT_PLAYER,
            currentPlayer: this.currentPlayer
        });
    }
    
    chooseExpansionIsland(col, row) {
        console.assert(this.turnPhase === TurnPhase.START_OF_TURN);

        // Get the island
        let island = this.getTile(col, row);
        let beaches = island.beaches;
        console.assert(island.nrShipsOnTile(this.currentPlayer) > 0);
        console.assert(island.hasEmptyBeachSlots());

        // Set it as the island for expansion this turn
        this.expansionIsland = island;
        this.beachesAvailableForExpansion = beaches.map(b => b.hasEmptyBeachSlots());

        // Record number of ships to be added
        this.shipsToAddInExpansion = Math.min(
            island.nrShipsOnTile(this.currentPlayer),  // ships to double
            this.beachesAvailableForExpansion.filter(a => a).length  // free beaches
        );

        // Broadcast change
        this.broadcastChange({
            type: ChangeType.ISLAND_SELECTED,
            col: island.col,
            row: island.row
        });

        // Go to expansion
        this.turnPhase = TurnPhase.EXPANDING;

        // Broadcast valid moves
        this.broadcastChange(this.getValidMoves());
    }

    expandAtSlot(beachNo, slotNo) {
        console.assert(this.turnPhase === TurnPhase.EXPANDING);
        console.assert(beachNo < this.expansionIsland.beaches.length);
        console.assert(slotNo < this.expansionIsland.beaches[beachNo].ships.length);

        // Add a ship here
        // TODO: player supplies
        this.expansionIsland.addShip(beachNo, slotNo, this.currentPlayer);
        this.shipsToAddInExpansion--;
        this.beachesAvailableForExpansion[beachNo] = false;

        this.broadcastChange({
            type: ChangeType.SHIP_ADDED,
            col: this.expansionIsland.col,
            row: this.expansionIsland.row,
            beachNo: beachNo,
            slotNo: slotNo,
            playerNo: this.currentPlayer
        });

        // Finished expanding?
        if (this.shipsToAddInExpansion == 0) {
            this.prepareToSailIfAppropriate()
        }

        // Broadcast valid moves
        this.broadcastChange(this.getValidMoves());
    }

    prepareToSailIfAppropriate() {
        this.turnPhase = TurnPhase.READY_TO_SAIL;

        let obj = this.getValidMovesReadyToSail();
        if (obj.beachExits.length == 0) {
            // Turn finished
            this.nextPlayer();
            this.turnPhase = TurnPhase.START_OF_TURN;
        }
    }

    sailFromExit(col, row, direction) {
        console.assert(this.turnPhase === TurnPhase.READY_TO_SAIL);
        let island = this.getTile(col, row);
        let beach = island.beachAtDirection(direction);
        console.assert(!(beach.hasEmptyBeachSlots()));

        // Ships leave beach and start sailing
        this.sailingFleet = [];
        for (let i = 0; i < beach.ships.length; i++) {
            this.sailingFleet[i] = beach.ships[i];
            beach.ships[i] = null;
        }
        this.broadcastChange({
            type: ChangeType.BEACH_EMPTIED,
            col: col,
            row: row,
            beachNo: beach.beachNo
        });

        // Fleet enters the neighbouring hex
        this.tileJustLeft = island;
        let fleetHex = hexNeighbor(col, row, direction);
        this.landingTile = this.getTile(fleetHex.col, fleetHex.row);
        if (this.landingTile === null) {
            this.placeRandomTile(fleetHex.col, fleetHex.row, direction);
            this.landingTile = this.getTile(fleetHex.col, fleetHex.row);
            console.assert(this.landingTile != null);
            this.broadcastChange({
                type: ChangeType.TILE_ADDED,
                tile: this.landingTile
            });
        }

        this.setValidLandingBeaches();
        this.landedOneOnEachBeach = false;
        this.prepareToLand();
        this.broadcastChange(this.getValidMoves());
    }

    prepareToLand() {
        this.turnPhase = TurnPhase.LANDING;
        if (this.validLandingBeaches.length == 0) {
            this.setValidLandingBeaches();
            this.landedOneOnEachBeach = true;
        }
        if (!this.landingTile.hasEmptyBeachSlots()) {
            // Bounce back
            let t = this.tileJustLeft;
            this.tileJustLeft = this.landingTile;
            this.landingTile = t;
            this.landedOneOnEachBeach = false;
            console.assert(this.landingTile);
            console.log("No more room: bouncing back");
            this.setValidLandingBeaches();
            this.prepareToLand();
        }
    }

    setValidLandingBeaches() {
        this.validLandingBeaches = this.landingTile.beaches.filter(b => b.hasEmptyBeachSlots());
    }

    landShip(landingShipNo, beachNo, slotNo) {
        let owner = this.sailingFleet[landingShipNo];
        this.sailingFleet.splice(landingShipNo, 1);
        if (!this.landedOneOnEachBeach) {
            let n = this.validLandingBeaches.indexOf(this.landingTile.beaches[beachNo]);
            this.validLandingBeaches.splice(n, 1);
        }

        this.landingTile.addShip(beachNo, slotNo, owner);
        this.broadcastChange({
            type: ChangeType.SHIP_ADDED,
            col: this.landingTile.col,
            row: this.landingTile.row,
            beachNo: beachNo,
            slotNo: slotNo,
            playerNo: owner
        });

        this.prepareToLand();

        if (this.sailingFleet.length == 0) {
            this.prepareToSailIfAppropriate();
        }
        
        this.broadcastChange(this.getValidMoves());
    }

    getTile(col, row) {
        // Linear search - perhaps a map would be better, but there's only 32.
        for (let tile of this.tiles) {
            if (tile.col === col && tile.row === row) {
                return tile;
            }
        }
        return null;
    }

    getValidMoves() {
        let obj;

        // Get the appropriate types of moves
        switch(this.turnPhase) {
        case TurnPhase.INITIAL_PLACEMENT: obj = this.getValidMovesInitialPlacement(); break;
        case TurnPhase.START_OF_TURN: obj = this.getValidMovesStartTurn(); break;
        case TurnPhase.EXPANDING: obj = this.getValidMovesExpanding(); break;
        case TurnPhase.READY_TO_SAIL: obj = this.getValidMovesReadyToSail(); break;
        case TurnPhase.LANDING: obj = this.getValidMovesLanding(); break;
        default: console.assert(false, "turn phase '" + this.turnPhase + "' cannot be handled");
        }

        // Mark this as a "valid moves" object for sending to the view
        obj.type = ChangeType.VALID_MOVES;
        return obj;
    }
    
    /**
     * Object describing valid slots for the current player to place a ship during initial placement.
     */
    getValidMovesInitialPlacement() {
        let validSlots = [];
        for (let b = 0; b < this.tonga.beaches.length; b++) {
            let beach = this.tonga.beaches[b];
            let sum = beach.ships.filter(x => x != null).length;
            if (sum < 2) {
                for (let slotNo = 0; slotNo < beach.capacity; slotNo++) {
                    if (beach.ships[slotNo] === null) {
                        validSlots.push({
                            col: this.tonga.col,
                            row: this.tonga.row,
                            beachNo: b,
                            slotNo: slotNo
                        });
                    }
                }
            }
        }
        return {beachSlots: validSlots};
    }

    /**
     * Object describing valid moves at start of a regular turn.
     *
     * This will include:
     * - coords of islands you can expand at;
     * - coords of islands you can claim as Royal Islands;
     * - the "special" option to remove all ships and get a new island.
     */
    getValidMovesStartTurn() {
        let expandableIslands = [];
        // TODO: check player stocks (15 ships each) - max expansion
        // TODO: special case for empty stock
        for (let tile of this.tiles) {
            if (tile.nrShipsOnTile(this.currentPlayer) >= 1
                && tile.hasEmptyBeachSlots()) {
                expandableIslands.push({col: tile.col, row: tile.row});
            }
        }
        return {expandableIslands: expandableIslands};
    }

    /**
     * Object describing valid moves during expansion.
     *
     * This will give the slots the player can add their new ships to.  Note
     * that the island has already been chosen.
     */
    getValidMovesExpanding() {
        let island = this.expansionIsland;
        let validSlots = [];

        for (let beachNo = 0; beachNo < island.beaches.length; beachNo++) {
            if (this.beachesAvailableForExpansion[beachNo]) {
                let beach = island.beaches[beachNo];
                for (let slotNo = 0; slotNo < beach.capacity; slotNo++) {
                    if (beach.ships[slotNo] === null) {
                        validSlots.push({
                            col: island.col,
                            row: island.row,
                            beachNo: beachNo,
                            slotNo: slotNo
                        });
                    }
                }
            }
        }
        return {beachSlots: validSlots};
    }

    /**
     * Object describing valid moves during "ready to sail" phase.
     *
     * This will give all the exits from all beaches that are full, and which
     * therefore need to sail before end of turn.  The player needs to choose
     * since the order is important, and the direction from beaches with
     * multiple exits.
     */
    getValidMovesReadyToSail() {
        let beachExits = [];
        for (let tile of this.tiles) {
            for (let b = 0; b < tile.beaches.length; b++) {
                if (!tile.beaches[b].hasEmptyBeachSlots()) {
                    for (let exitDirection of tile.beaches[b].exits) {
                        beachExits.push({
                            col: tile.col,
                            row: tile.row,
                            //beachNo: b,  // this shouldn't be necessary
                            exitDirection: exitDirection
                        });
                    }
                }
            }
        }
        return {beachExits: beachExits};
    }

    /**
     * Object describing valid moves while landing at an island.
     *
     * This will give the slots the player can add another ship to, as well as
     * the ships that are yet to land.  Note that the island has already been
     * chosen.
     */
    getValidMovesLanding() {
        let beachSlots = [];
        for (let beach of this.validLandingBeaches) {
            for (let slotNo = 0; slotNo < beach.capacity; slotNo++) {
                if (beach.ships[slotNo] === null) {
                    beachSlots.push({
                        col: this.landingTile.col,
                        row: this.landingTile.row,
                        beachNo: beach.beachNo,
                        slotNo: slotNo
                    });
                }
            }
        }
        return {
            beachSlots: beachSlots,
            landingShips: this.sailingFleet,
            landingCol: this.landingTile.col,
            landingRow: this.landingTile.row
        };
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

    place(col, row, rotation) {
        this.col = col;
        this.row = row;
        this.rotate(rotation);
    }

    rotate(rotation) {
        throw new Error("This should be overridden!");
    }

    nrShipsOnTile(playerNo = null) {
        throw new Error("This should be overridden!");
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

        // TODO: add beaches based on orientation
        this.beaches = beaches;

        let i = 0;
        for (let beach of this.beaches) {
            beach.beachNo = i;
            i++;
        }
    }

    rotate(rotation) {
        for (let beach of this.beaches) {
            for (let i = 0; i < beach.exits.length; i++) {
                beach.exits[i] = (beach.exits[i] + rotation) % 6;
            }
        }
    }

    addShip(beachNo, slotNo, playerNo) {
        this.beaches[beachNo].addShip(slotNo, playerNo);
    }

    nrShipsOnTile(playerNo = null) {
        let nr = 0;
        for (let beach of this.beaches) {
            //if (beach) {
                nr += beach.nrShipsOnBeach(playerNo);
            //}
        }
        return nr;
    }

    hasEmptyBeachSlots() {
        for (let beach of this.beaches) {
            if (beach.hasEmptyBeachSlots()) {
                return true;
            }
        }
        return false;
    }

    beachAtDirection(direction) {
        for (let beach of this.beaches) {
            if (beach.exits.includes(direction)) {
                return beach;
            }
        }
        return null;
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

    nrShipsOnTile(playerNo = null) {
        return 0;
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

    nrShipsOnBeach(playerNo = null) {
        let nr = 0;
        for (let i = 0; i < this.capacity; i++) {
            if (this.ships[i] === playerNo
                || (this.ships[i] != null && playerNo === null)) {
                nr++;
            }
        }
        return nr;
    }

    hasEmptyBeachSlots() {
        for (let i = 0; i < this.capacity; i++) {
            if (this.ships[i] === null) {
                return true;
            }
        }
        return false;
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

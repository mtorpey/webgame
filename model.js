"use strict";

const TurnPhase = {
    INITIAL_PLACEMENT: "initial placement",  // place 2 ships each on Tonga
    RETRIEVE_ONE: "retrieve one",  // empty supply, so grab one ship before expansion
    CHOOSING_EXPANSION_ISLAND: "choosing expansion island",  // choose an island to expand (or royal/special)
    EXPANDING: "expanding",  // choose the beaches to place your new ships
    READY_TO_SAIL: "ready to sail",  // choose a beach to sail from
    LANDING: "landing",  // choose which beaches the ships land on
    GAME_OVER: "game over"
}

const ChangeType = {
    SHIP_ADDED: "ship added",
    SHIP_RETRIEVED: "ship retrieved",
    BEACH_EMPTIED: "beach emptied",
    ISLAND_SELECTED: "island selected",  // for expansion
    TILE_ADDED: "tile added",
    ROYAL_ISLAND_CLAIMED: "royal island claimed",
    SUPPLIES_CHANGED: "supplies changed",
    NEXT_PLAYER: "next player",
    VALID_MOVES: "valid moves",
    GAME_OVER: "game over"
}

const ActionType = {
    INITIAL_PLACEMENT: "initial placement",
    RETRIEVE_ONE: "retrieve one",
    SAIL_FROM_EXIT: "sail from exit",
    CHOOSE_EXPANSION_ISLAND: "choose expansion island",
    CLAIM_AS_ROYAL_ISLAND: "claim as royal island",
    LAND_SHIP: "land ship",
    EXPAND_AT_SLOT: "expand at slot"
}

const MAX_SUPPLY = 15;

class Model {
    tiles;
    tileSupply;
    nrIslandsLeft;
    nrSeaTilesLeft;

    finalTurn;

    names;
    nrPlayers;
    currentPlayer;
    supplies;
    turnPhase;

    tonga;

    expansionIsland;
    shipsToAddInExpansion;
    beachesAvailableForExpansion;

    sailingFleet;
    tileJustLeft;
    landingTile;
    landedOneOnEachBeach;

    scores;
    tilesOccupied;
    winner;

    constructor(names) {
        // Setup players
        this.names = names;
        this.nrPlayers = names.length;
        console.assert([2,3,4,5,6].includes(this.nrPlayers));
        this.supplies = [];
        for (let p = 0; p < this.nrPlayers; p++) {
            this.supplies[p] = MAX_SUPPLY;
        }
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
        this.placeTile(0, 0, 0, this.tonga);

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
            new IslandTile("Tuvalu", 4, [new Beach([0], 4), new Beach([1, 2], 3), new Beach([4, 5], 2)]),
            new SeaTile([0, 1], 0, [2, 3], 0, [4, 5], 0),
            new SeaTile([0, 1], 2, [2, 3], 0, [4, 5], 4),
            new SeaTile([0, 1], 2, [2, 3], 2, [4, 5], 2),
            new SeaTile([0, 1], 4, [2, 3], 0, [4, 5], 3),
            new SeaTile([0, 3], 3, [1, 5], 0, [2, 4], 2),
            new SeaTile([0, 3], 3, [1, 5], 3, [2, 4], 3),
            new SeaTile([0, 3], 4, [1, 5], 0, [2, 4], 3),
            new SeaTile([0, 3], 4, [1, 5], 4, [2, 4], 4),
            new SeaTile([0, 4], 3, [1, 3], 2, [2, 5], 4),
            new SeaTile([0, 4], 3, [1, 3], 3, [2, 5], 4),
            new SeaTile([0, 4], 4, [1, 3], 0, [2, 5], 2),
            new SeaTile([0, 4], 4, [1, 3], 4, [2, 5], 3),
            new SeaTile([0, 5], 0, [1, 2], 2, [3, 4], 2),
            new SeaTile([0, 5], 0, [1, 2], 2, [3, 4], 3),
            new SeaTile([0, 5], 2, [1, 2], 0, [3, 4], 0),
            new SeaTile([0, 5], 2, [1, 2], 4, [3, 4], 3)
        ];
        this.tileSupply = this.tileSupply.sort(() => Math.random() - 0.5);
        this.nrIslandsLeft = this.tileSupply.filter(t => t.beaches).length;
        this.nrSeaTilesLeft = this.tileSupply.filter(t => t.exits).length;
        console.assert(this.nrIslandsLeft + this.nrSeaTilesLeft === this.tileSupply.length);

        this.finalTurn = false;
    }

    placeTile(col, row, rotation, tile) {
        tile.place(col, row, rotation);
        this.tiles.push(tile);
        if (tile.beaches) {
            this.nrIslandsLeft --;
        } else {
            this.nrSeaTilesLeft --;
        }
        if (this.nrIslandsLeft === 0 || this.nrSeaTilesLeft === 0) {
            this.finalTurn = true;
        }
    }

    placeRandomTile(col, row, rotation) {
        let tile = this.tileSupply.pop();
        console.assert(tile);
        this.placeTile(col, row, rotation, tile);
    }

    initialPlacement(beachNo, slotNo) {
        console.assert(this.turnPhase === TurnPhase.INITIAL_PLACEMENT);
        console.assert(this.supplies[this.currentPlayer] > 0);

        // Add the ship
        this.tonga.addShip(beachNo, slotNo, this.currentPlayer);
        this.broadcastChange({
            type: ChangeType.SHIP_ADDED,
            col: this.tonga.col,
            row: this.tonga.row,
            beachNo: beachNo,
            slotNo: slotNo,
            playerNo: this.currentPlayer,
        });
        this.supplies[this.currentPlayer] --;
        this.broadcastChange({
            type: ChangeType.SUPPLIES_CHANGED,
            supplies: this.supplies
        });

        // Advance player turn
        this.nextPlayer();

        // Is initial placement done?
        if (this.tonga.nrShipsOnTile(this.currentPlayer) === 2) {
            this.turnPhase = TurnPhase.CHOOSING_EXPANSION_ISLAND;
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

    retrieveOne(col, row, beachNo, slotNo) {
        console.assert(this.turnPhase === TurnPhase.RETRIEVE_ONE);
        let island = this.getTile(col, row);
        let beach = island.beaches[beachNo];
        console.assert(beach.ships[slotNo] === this.currentPlayer);

        beach.ships[slotNo] = null;
        this.broadcastChange({
            type: ChangeType.SHIP_RETRIEVED,
            col: col,
            row: row,
            beachNo: beachNo,
            slotNo: slotNo
        });
        
        this.supplies[this.currentPlayer] ++;
        this.broadcastChange({
            type: ChangeType.SUPPLIES_CHANGED,
            supplies: this.supplies
        });

        this.turnPhase = TurnPhase.CHOOSING_EXPANSION_ISLAND;
        this.broadcastChange(this.getValidMoves());
    }

    chooseExpansionIsland(col, row) {
        console.assert(this.turnPhase === TurnPhase.CHOOSING_EXPANSION_ISLAND);

        // Get the island
        let island = this.getTile(col, row);
        let beaches = island.beaches;
        console.assert(island.nrShipsOnTile(this.currentPlayer) > 0
                       || !this.hasShipsOnBoard(this.currentPlayer));
        console.assert(island.hasEmptyBeachSlots());

        // Set it as the island for expansion this turn
        this.expansionIsland = island;
        this.beachesAvailableForExpansion = beaches.map(b => b.hasEmptyBeachSlots());

        // Record number of ships to be added
        if (!this.hasShipsOnBoard(this.currentPlayer)) {
            // Nothing on the board, so add 2 to Tonga or 1 anywhere else
            this.shipsToAddInExpansion = (island === this.tonga ? 2 : 1);
        } else {
            this.shipsToAddInExpansion = Math.min(
                island.nrShipsOnTile(this.currentPlayer),  // ships to double
                this.beachesAvailableForExpansion.filter(a => a).length,  // free beaches
                this.supplies[this.currentPlayer]  // ships available in supply
            );
        }

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

    claimAsRoyalIsland(col, row) {
        let island = this.getTile(col, row);
        console.assert(island.beaches);
        console.assert(island.canClaimAsRoyalIsland(this.currentPlayer));
        console.assert(this.nrRoyalIslands(this.currentPlayer) < 2);
        let ships = island.claimAsRoyalIsland(this.currentPlayer);
        this.broadcastChange({
            type: ChangeType.ROYAL_ISLAND_CLAIMED,
            col: col,
            row: row,
            playerNo: this.currentPlayer
        });

        this.supplies[this.currentPlayer] += ships;
        this.broadcastChange({
            type: ChangeType.SUPPLIES_CHANGED,
            supplies: this.supplies
        });

        for (let beach of island.beaches) {
            this.broadcastChange({
                type: ChangeType.BEACH_EMPTIED,
                col: col,
                row: row,
                beachNo: beach.beachNo
            });
        }
        
        this.prepareToSailIfAppropriate();  // Will start next turn
        this.broadcastChange(this.getValidMoves());
    }

    expandAtSlot(beachNo, slotNo) {
        console.assert(this.turnPhase === TurnPhase.EXPANDING);
        console.assert(beachNo < this.expansionIsland.beaches.length);
        console.assert(slotNo < this.expansionIsland.beaches[beachNo].ships.length);
        console.assert(this.supplies[this.currentPlayer] > 0);

        // Add a ship here
        this.expansionIsland.addShip(beachNo, slotNo, this.currentPlayer);
        this.supplies[this.currentPlayer] --;
        this.broadcastChange({
            type: ChangeType.SUPPLIES_CHANGED,
            supplies: this.supplies
        });
        this.shipsToAddInExpansion--;
        this.beachesAvailableForExpansion[beachNo] = false;

        this.broadcastChange({
            type: ChangeType.SHIP_ADDED,
            col: this.expansionIsland.col,
            row: this.expansionIsland.row,
            beachNo: beachNo,
            slotNo: slotNo,
            playerNo: this.currentPlayer,
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
            if (this.finalTurn) {
                this.turnPhase = TurnPhase.GAME_OVER;
                this.computeFinalScores();
                this.broadcastChange({
                    type: ChangeType.GAME_OVER,
                    finalScores: this.scores,
                    finalTilesOccupied: this.tilesOccupied,
                    nrShips: this.nrShips,
                    winner: this.winner
                });
            } else if (this.supplies[this.currentPlayer] === 0) {
                this.turnPhase = TurnPhase.RETRIEVE_ONE;
            } else {
                this.turnPhase = TurnPhase.CHOOSING_EXPANSION_ISLAND;
            }
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

        this.tileJustLeft = this.getTile(col, row);

        this.sailToNextHex(col, row, direction);
    }

    sailToNextHex(col, row, direction) {
        // Fleet enters the neighbouring hex
        let fleetHex = hexNeighbor(col, row, direction);
        this.landingTile = this.getTile(fleetHex.col, fleetHex.row);

        // New tile if available
        if (this.landingTile === null) {
            if (this.finalTurn) {
                // No more tile draws allowed
                this.killSailingFleet();
                this.prepareToSailIfAppropriate();
                this.broadcastChange(this.getValidMoves());
                return;
            } else {
                // Draw another tile and sail there
                this.placeRandomTile(fleetHex.col, fleetHex.row, direction);
                this.landingTile = this.getTile(fleetHex.col, fleetHex.row);
                console.assert(this.landingTile != null);
                this.broadcastChange({
                    type: ChangeType.TILE_ADDED,
                    tile: this.landingTile,
                    nrIslandsLeft: this.nrIslandsLeft,
                    nrSeaTilesLeft: this.nrSeaTilesLeft
                });
            }
        }

        if (this.landingTile.beaches) {
            // Reach island
            this.setValidLandingBeaches();
            this.landedOneOnEachBeach = false;
            this.prepareToLand();
            this.broadcastChange(this.getValidMoves());
        } else {
            // Die if not enough colours in fleet
            if (new Set(this.sailingFleet).size < this.landingTile.minCivs[(direction+3)%6]) {
                this.killSailingFleet();
                this.prepareToSailIfAppropriate();
                this.broadcastChange(this.getValidMoves());
            } else {
                // Reach sea tile and carry on
                this.sailToNextHex(
                    this.landingTile.col,
                    this.landingTile.row,
                    this.landingTile.exits[(direction + 3) % 6]
                );
            }
        }
    }

    killSailingFleet() {
        for (let i = 0; i < this.sailingFleet.length; i++) {
            this.supplies[this.sailingFleet[i]] ++;
        }
        this.broadcastChange({
            type: ChangeType.SUPPLIES_CHANGED,
            supplies: this.supplies
        });
        this.sailingFleet = [];
    }

    prepareToLand() {
        this.turnPhase = TurnPhase.LANDING;
        if (this.validLandingBeaches.length == 0) {
            this.setValidLandingBeaches();
            this.landedOneOnEachBeach = true;
        }
        if (!this.landingTile.hasEmptyBeachSlots() || this.landingTile.isRoyalIsland()) {
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

    computeFinalScores() {
        console.assert(this.turnPhase === TurnPhase.GAME_OVER);
        let scores = [];
        let tilesOccupied = [];
        let nrShips = [];
        let bestSoFar = 0;
        for (let playerNo = 0; playerNo < this.nrPlayers; playerNo++) {
            scores[playerNo] = 0;
            tilesOccupied[playerNo] = 0;
            nrShips[playerNo] = [];
            for (let tile of this.tiles) {
                let s = tile.nrShipsOnTile(playerNo);
                if (s > 0 || tile.royalOwner === playerNo) {
                    console.assert(tile.value != undefined);
                    scores[playerNo] += tile.value;
                    tilesOccupied[playerNo] ++;
                    nrShips[playerNo] += s;
                }
            }
            if ((scores[playerNo] > scores[bestSoFar])
                || (scores[playerNo] == scores[bestSoFar]
                    && tilesOccupied[playerNo] > tilesOccupied[bestSoFar])
                || (scores[playerNo] == scores[bestSoFar]
                    && tilesOccupied[playerNo] == tilesOccupied[bestSoFar]
                    && nrShips[playerNo] < nrShips[bestSoFar])) {
                bestSoFar = playerNo;
                // TODO: handle further ties? (right now lowest player number wins)
            }
        }
        this.scores = scores;
        this.tilesOccupied = tilesOccupied;
        this.nrShips = nrShips;
        this.winner = bestSoFar;
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

    nrRoyalIslands(playerNo) {
        let nrRoyalIslands = 0;
        for (let tile of this.tiles) {
            if (tile.royalOwner === playerNo) {
                nrRoyalIslands++;
            }
        }
        return nrRoyalIslands;
    }

    hasShipsOnBoard(playerNo) {
        return this.supplies[playerNo] + this.nrRoyalIslands(playerNo) < MAX_SUPPLY;
    }

    getValidMoves() {
        let obj;

        // Get the appropriate types of moves
        switch(this.turnPhase) {
        case TurnPhase.INITIAL_PLACEMENT: obj = this.getValidMovesInitialPlacement(); break;
        case TurnPhase.RETRIEVE_ONE: obj = this.getValidMovesRetrieveOne(); break;
        case TurnPhase.CHOOSING_EXPANSION_ISLAND: obj = this.getValidMovesChoosingExpansionIsland(); break;
        case TurnPhase.EXPANDING: obj = this.getValidMovesExpanding(); break;
        case TurnPhase.READY_TO_SAIL: obj = this.getValidMovesReadyToSail(); break;
        case TurnPhase.LANDING: obj = this.getValidMovesLanding(); break;
        case TurnPhase.GAME_OVER: obj = {}; break;  // no valid moves
        default: console.assert(false, "turn phase '" + this.turnPhase + "' cannot be handled");
        }

        // Mark this as a "valid moves" object for sending to the view
        obj.type = ChangeType.VALID_MOVES;

        // Include the current player and turn phase
        obj.currentPlayer = this.currentPlayer;
        console.log("current player", obj.currentPlayer);
        obj.turnPhase = this.turnPhase;

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
     * Object describing valid beaches from which a ship may be retrieved.
     *
     * This applies when the current player starts their turn with no ships in their supply.
     */
    getValidMovesRetrieveOne() {
        let validSlots = [];
        for (let tile of this.tiles) {
            if (tile.beaches) {
                for (let beach of tile.beaches) {
                    for (let i = 0; i < beach.capacity; i++) {
                        if (beach.ships[i] === this.currentPlayer) {
                            validSlots.push({
                                col: tile.col,
                                row: tile.row,
                                beachNo: beach.beachNo,
                                slotNo: i
                            });
                        }
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
    getValidMovesChoosingExpansionIsland() {
        // Note: if zero ships of this colour on the board, then can add anywhere
        let expandableIslands = [];
        for (let tile of this.tiles) {
            if ((tile.nrShipsOnTile(this.currentPlayer) >= 1
                 && tile.hasEmptyBeachSlots())
                || (!this.hasShipsOnBoard(this.currentPlayer) && tile.beaches)) {
                expandableIslands.push({col: tile.col, row: tile.row});
            }
        }

        let claimableIslands;
        if (this.nrRoyalIslands(this.currentPlayer) < 2) {
            claimableIslands = this.tiles.filter(t => t.canClaimAsRoyalIsland(this.currentPlayer));
        } else {
            claimableIslands = [];
        }

        return {
            expandableIslands: expandableIslands,
            claimableIslands: claimableIslands
        };
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
            if (tile.beaches) {
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
    listener;
    registerListener(listener) {
        this.listener = listener;
        this.broadcastModel();
        this.broadcastChange(this.getValidMoves());
    }
    broadcastChange(obj) {
        console.log("sending change");
        this.listener("change", obj);
    }
    broadcastModel() {
        console.log("sending model");
        this.listener("model", this);
    }

    // Receiving actions from the view
    applyAction(obj) {
        console.log("action", obj);
        switch(obj.type) {
        case ActionType.INITIAL_PLACEMENT: this.initialPlacement(obj.beachNo, obj.slotNo); break;
        case ActionType.RETRIEVE_ONE: this.retrieveOne(obj.col, obj.row, obj.beachNo, obj.slotNo); break;
        case ActionType.SAIL_FROM_EXIT: this.sailFromExit(obj.col, obj.row, obj.direction); break;
        case ActionType.CHOOSE_EXPANSION_ISLAND: this.chooseExpansionIsland(obj.col, obj.row); break;
        case ActionType.CLAIM_AS_ROYAL_ISLAND: this.claimAsRoyalIsland(obj.col, obj.row); break;
        case ActionType.LAND_SHIP: this.landShip(obj.landingShipNo, obj.beachNo, obj.slotNo); break;
        case ActionType.EXPAND_AT_SLOT: this.expandAtSlot(obj.beachNo, obj.slotNo); break;
        default: console.assert(false, "Action type '" + obj.type + "' cannot be handled");
        }
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

    canClaimAsRoyalIsland(playerNo) {
        throw new Error("This should be overridden!");
    }
}

class IslandTile extends Tile {
    name;
    value;
    beaches;
    royalOwner;

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

        this.royalOwner = null;
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

    canClaimAsRoyalIsland(playerNo) {
        if (this.isRoyalIsland() || this.value === 0) {
            return false;
        }
        let present = false;
        for (let beach of this.beaches) {
            for (let slotNo = 0; slotNo < beach.capacity; slotNo++) {
                if (beach.ships[slotNo] === playerNo) {
                    // Player has at least one ship here
                    present = true;
                } else if (beach.ships[slotNo] != null) {
                    // Another player is here
                    return false;
                }
            }
        }
        return present;
    }

    isRoyalIsland() {
        if (this.royalOwner === null) {
            return false;
        } else {
            return true;
        }
    }

    /** Mark as royal island and return number of ships to return to supply */
    claimAsRoyalIsland(playerNo) {
        console.assert(this.canClaimAsRoyalIsland(playerNo));
        this.royalOwner = playerNo;

        let nrShips = 0;
        for (let beach of this.beaches) {
            for (let slotNo = 0; slotNo < beach.capacity; slotNo++) {
                if (beach.ships[slotNo] === playerNo) {
                    beach.ships[slotNo] = null;
                    nrShips++;
                } else {
                    console.assert(beach.ships[slotNo] === null);
                }
            }
        }

        // Return all ships but one to supply
        return nrShips - 1;
    }
}

class SeaTile extends Tile {
    exits;

    /**
     * Creates a sea tile, but doesn't place it.
     *
     * @param {list of 2 ints} pathX Two sides of the hex that are joined
     * @param {int} minCivX Minimum number of colours needed
     */
    constructor(path0, minCiv0, path1, minCiv1, path2, minCiv2) {
        super();

        this.exits = [];
        this.minCivs = [];
        let paths = [path0, path1, path2];
        let minCivs = [minCiv0, minCiv1, minCiv2];
        for (let i = 0; i < 3; i++) {
            let path = paths[i];
            let minCiv = minCivs[i];
            this.exits[path[0]] = path[1];
            this.exits[path[1]] = path[0];
            this.minCivs[path[0]] = minCiv;
            this.minCivs[path[1]] = minCiv;
        }

        for (let side = 0; side < 6; side++) {
            console.assert(this.exits[side] >= 0);
            console.assert(this.exits[side] < 6);
            console.assert(this.minCivs[side] >= 0);
        }
    }

    rotate(rotation) {
        let newExits = [];
        let newMinCivs = [];
        for (let side = 0; side < 6; side++) {
            newExits[side] = (this.exits[(side - rotation + 6) % 6] + rotation) % 6;
            newMinCivs[side] = this.minCivs[(side - rotation + 6) % 6];
        }
        this.exits = newExits;
        this.minCivs = newMinCivs;
    }

    nrShipsOnTile(playerNo = null) {
        return 0;
    }

    canClaimAsRoyalIsland(playerNo) {
        return false;
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

module.exports = {Model};

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

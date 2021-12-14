"use strict";
// TODO: highlighting chosen island for other players

const COLOR_EMPTYSPACE = null;
const COLOR_BACKGROUND = 'darkblue';
const COLOR_GRID = null;
const COLOR_COAST = 'dodgerblue'
const COLOR_SEA = 'dodgerblue';
const COLOR_ISLAND = 'darkgreen';
const COLOR_BEACH = 'wheat';
const COLOR_PATH = 'white';
const COLOR_PLAYER = [
    'limegreen',
    'red',
    'yellow',
    'mediumorchid',
    'orange',
    'dodgerblue'
];
const COLOR_PLAYER_CONTRAST = [
    'darkblue',
    'white',
    'darkblue',
    'white',
    'white',
    'white'
]

class View {

    hexSide = 300;
    left = -640;
    top = -360;

    hexPositions = new Map();

    slotButtons = new Map();
    slotGroups = new Map();
    islandNameButtons = new Map();
    royalIslandButtons = new Map();
    sailButtons = new Map();
    pathLabels = new Map();

    turnBox;
    suppliesBox;

    latestModel;
    validMoves = {};

    /**
     * What to do when the model changes.
     *
     * @param obj JSON object describing the changes
     */
    modelChanged(obj) {
        console.log("change", obj);
        switch(obj.type) {
        case ChangeType.SHIP_ADDED: this.addShip(obj.col, obj.row, obj.beachNo, obj.slotNo, obj.playerNo); break;
        case ChangeType.SHIP_RETRIEVED: this.retrieveShip(obj.col, obj.row, obj.beachNo, obj.slotNo); break;
        case ChangeType.BEACH_EMPTIED: this.emptyBeach(obj.col, obj.row, obj.beachNo); break;
        case ChangeType.ISLAND_SELECTED: break;  // For now, do nothing.  Highlight maybe?
        case ChangeType.TILE_ADDED: this.addTile(obj); break;
        case ChangeType.ROYAL_ISLAND_CLAIMED: this.claimAsRoyalIsland(obj.col, obj.row, obj.playerNo); break;
        case ChangeType.SUPPLIES_CHANGED: this.presentSupplies(obj.supplies); break;
        case ChangeType.NEXT_PLAYER: this.presentCurrentPlayer(obj.currentPlayer); break;
        case ChangeType.VALID_MOVES: this.presentValidMoves(obj); break;
        case ChangeType.GAME_OVER: this.gameOver(obj.winner, obj.finalScores, obj.finalTilesOccupied, obj.nrShips); break;
        default: console.assert(false, "change type '" + obj.type + "' cannot be handled");
        }
    }

    get gridLineWidth() {
        return this.hexSide / 10;
    }

    get canvas() {
        return document.getElementById('gameCanvas');
    }

    get canvasContainer() {
        return document.getElementById('gameCanvasContainer');
    }

    get context() {
        return this.canvas.getContext('2d');
    }

    get turnView() {
        return document.getElementById('turnView');
    }

    get turnViewRow() {
        return document.getElementById('turnViewRow');
    }

    get hintView() {
        return document.getElementById('hint');
    }

    get supplyView() {
        return document.getElementById('supplyView');
    }

    get supplyViewRow() {
        return document.getElementById('supplyViewRow');
    }

    get islandsLeftView() {
        return document.getElementById('islandsLeftView');
    }

    get seaTilesLeftView() {
        return document.getElementById('seaTilesLeftView');
    }

    rescaleToInclude(col, row) {
        this.hexPositions.set({col: col, row: row});

        let center = this.hexCenter(col, row);
        let top = center.y;
        let bottom = center.y;
        let left = center.x;
        let right = center.x;

        for (let hex of this.hexPositions.keys()) {
            top = Math.min(top, this.hexPoint(hex.col, hex.row, 0).y);
            bottom = Math.max(bottom, this.hexPoint(hex.col, hex.row, 3).y);
            left = Math.min(left, this.hexPoint(hex.col, hex.row, 5).x);
            right = Math.max(right, this.hexPoint(hex.col, hex.row, 2).x);
        }

        // Margins
        top -= this.hexSide / 4;
        bottom += this.hexSide / 4;
        left -= this.hexSide / 4;
        right += this.hexSide / 4;

        center = {x: (right + left) / 2, y: (bottom + top) / 2};

        let canvas = this.canvas;
        let scaleX = (right - left) / canvas.width;
        let scaleY = (bottom - top) / canvas.height;
        this.top += center.y// - (bottom - top) / 2;
        this.left += center.x// - (right - left) / 2;
        if (scaleY > scaleX) {
            this.top -= (bottom - top) / 2;
            this.left -= (canvas.width * scaleY) / 2;
        } else {
            this.left -= (right - left) / 2;
            this.top -= (canvas.height * scaleX) / 2;
        }
        let scale = Math.max(scaleX, scaleY);
        this.top /= scale;
        this.left /= scale;
        this.hexSide /= scale;

        //controller.draw();
    }

    saveSlotButton(col, row, beachNo, slotNo, button) {
        this.slotButtons.set(col + "," + row + "," + beachNo + "," + slotNo, button);
    }

    getSlotButton(col, row, beachNo, slotNo) {
        return this.slotButtons.get(col + "," + row + "," + beachNo + "," + slotNo);
    }

    applySlotButtons(f) {
        this.slotButtons.forEach(f);
    }

    saveSlotGroup(col, row, beachNo, group) {
        this.slotGroups.set(col + "," + row + "," + beachNo, group);
    }

    getSlotGroup(col, row, beachNo) {
        return this.slotGroups.get(col + "," + row + "," + beachNo);
    }

    savePathLabel(col, row, side, button) {
        this.pathLabels.set(col + "," + row + "," + side, button);
    }

    getPathLabel(col, row, side) {
        return this.pathLabels.get(col + "," + row + "," + side);
    }

    saveIslandNameButton(col, row, button) {
        this.islandNameButtons.set(col + "," + row, button);
    }

    getIslandNameButton(col, row) {
        return this.islandNameButtons.get(col + "," + row);
    }

    applyIslandNameButtons(f) {
        this.islandNameButtons.forEach(f);
    }

    saveRoyalIslandButton(col, row, button) {
        this.royalIslandButtons.set(col + "," + row, button);
    }

    getRoyalIslandButton(col, row) {
        return this.royalIslandButtons.get(col + "," + row);
    }

    applyRoyalIslandButtons(f) {
        this.royalIslandButtons.forEach(f);
    }

    saveSailButton(col, row, exitDirection, button) {
        this.sailButtons.set(col + "," + row + "," + exitDirection, button);
    }

    getSailButton(col, row, exitDirection) {
        return this.sailButtons.get(col + "," + row + "," + exitDirection);
    }

    applySailButtons(f) {
        this.sailButtons.forEach(f);
    }

    deleteAllButtons() {
        // TODO: remove this?  Never used?
        this.applySlotButtons(b => b.parentNode.removeChild(b));
        this.slotButtons = null;
        for (let group of document.getElementsByClassName("beachGroup")) {
            group.remove();
        }
        this.applyIslandNameButtons(b => b.remove());
        this.islandNameButtons = new Map();
        this.applySailButtons(b => b.remove());
        this.sailButtons = new Map();
        this.deleteLandingSlotGroup();
    }

    hexCenter(col, row) {
        let x = (3 / 2) * this.hexSide * col - this.left;
        let y = Math.sqrt(3) * this.hexSide * row - this.top;
        if (Math.abs(col % 2) == 1) {
            y += Math.sqrt(3)/2 * this.hexSide;
        }
        return {'x': x, 'y': y}
    }

    hexPoint(col, row, pointNo) {
        pointNo %= 6;
        let r32 = Math.sqrt(3)/2;
        let points = [
            {'x': -1/2, 'y': -r32},
            {'x': +1/2, 'y': -r32},
            {'x': +1,   'y': 0},
            {'x': +1/2, 'y': +r32},
            {'x': -1/2, 'y': +r32},
            {'x': -1,   'y': 0},
        ];
        let center = this.hexCenter(col, row);
        return {
            x: center.x + points[pointNo].x * this.hexSide,
            y: center.y + points[pointNo].y * this.hexSide
        };
    }

    hexMidEdge(col, row, direction) {
        return this.midPoint(
            this.hexPoint(col, row, direction),
            this.hexPoint(col, row, direction + 1)
        );
    }

    midPoint(point1, point2) {
        return {
            x: (point1.x + point2.x) / 2,
            y: (point1.y + point2.y) / 2
        };
    }

    drawMap(model) {
        console.log("model", model);
        this.latestModel = model;

        let canvas = this.canvas;
        let context = this.context;
        canvas.width = window.innerWidth * 0.98;
        canvas.height = window.innerHeight * 0.9;

        this.rescaleToInclude(0, 0);

        context.fillStyle = COLOR_BACKGROUND;
        context.fillRect(0, 0, canvas.width, canvas.height);

        for (let tile of model.tiles) {
            this.drawTile(tile);
        }

        this.drawGrid();

        this.validMoves.turnPhase = model.turnPhase;

        this.presentValidMoves();
        this.presentCurrentPlayer(model.currentPlayer, model.nrPlayers);
        this.presentSupplies(model.supplies);
        this.presentTilesLeft(model.nrIslandsLeft, model.nrSeaTilesLeft);

        if (model.winner != null) {
            this.gameOver(model.winner, model.scores, model.finalTilesOccupied, model.nrShips);
        }
    }

    drawGrid() {
        let nrCols = this.canvas.width / (this.hexSide * 3 / 2) + 1;
        let nrRows = this.canvas.height / (this.hexSide * Math.sqrt(3)) + 1;
        let firstCol = Math.floor(this.left / (this.hexSide * 3 / 2));
        let firstRow = Math.floor(this.top / (this.hexSide * Math.sqrt(3)));
        for (let col = firstCol; col < firstCol + nrCols; col++) {
            for (let row = firstRow; row < firstRow + nrRows; row++) {
                this.drawHex(col, row, this.hexSide, COLOR_GRID, COLOR_EMPTYSPACE);
            }
        }
    }

    drawTile(tile) {
        if (tile.beaches) {
            this.drawIsland(tile);
        } else {
            console.assert(tile.exits);
            this.drawSeaTile(tile);
        }
    }

    drawSeaTile(tile) {
        this.hexPositions.set({col: tile.col, row: tile.row});
        this.drawHex(tile.col, tile.row, this.hexSide, COLOR_COAST, COLOR_SEA);
        for (let side = 0; side < 6; side++) {
            this.drawPath(tile.col, tile.row, side, tile.exits[side]);
            if (tile.minCivs[side] > 0) {
                this.createPathLabel(tile.col, tile.row, side, tile.minCivs[side]);
            }
        }
    }

    drawPath(col, row, entry, exit) {
        let startPt = this.hexMidEdge(col, row, entry);
        let endPt = this.hexMidEdge(col, row, exit);
        let center = this.hexCenter(col, row);
        let context = this.context;
        context.beginPath();
        context.strokeStyle = COLOR_PATH;
        context.moveTo(startPt.x, startPt.y);
        let radius;
        let diff = Math.abs(entry - exit);
        if (diff == 1 || diff == 5) {
            radius = this.hexSide / 2.5;
        } else if (diff == 2 || diff == 4) {
            radius = this.hexSide / 1;
        } else {
            radius = this.hexSide * 10;
        }
        context.arcTo(center.x, center.y, endPt.x, endPt.y, radius);
        context.stroke();
    }

    createPathLabel(col, row, side, minCivs) {
        let angle = side * Math.PI / 3;
        let hexCenter = this.hexCenter(col, row);
        let r32 = Math.sqrt(3)/2;

        let x = hexCenter.x + Math.sin(angle) * this.hexSide * r32*0.7;
        let y = hexCenter.y - Math.cos(angle) * this.hexSide * r32*0.7;
        let buttonWidth = this.hexSide / 4;

        let button = this.getPathLabel(col, row, side);
        if (!button) {
            button = document.createElement("button");
            this.savePathLabel(col, row, side, button);
            this.canvasContainer.appendChild(button);
        }
        button.classList = "pathLabel"
        button.style.width = buttonWidth + "px";
        button.style.height = buttonWidth + "px";
        button.style.left = x - buttonWidth/2 + "px";
        button.style.top = y - buttonWidth/2 + "px";
        button.innerHTML = "" + minCivs;
        button.style.fontSize = this.hexSide * 0.17 + "px";
        button.disabled = true;
        button.col = col;
        button.row = row;
        button.side = side;
    }

    drawIsland(island) {
        this.hexPositions.set({col: island.col, row: island.row});
        this.drawHex(island.col, island.row, this.hexSide, COLOR_COAST, COLOR_ISLAND);
        this.createIslandNameButton(island.name, island.value, island.col, island.row);
        this.createRoyalIslandButton(island.col, island.row);
        for (let beachNo = 0; beachNo < island.beaches.length; beachNo++) {
            let beach = island.beaches[beachNo];
            this.drawBeach(island.col, island.row, beachNo, beach);
        }

        if (island.royalOwner != null) {
            this.claimAsRoyalIsland(island.col, island.row, island.royalOwner);
        }

        // Cover up those edges
        this.drawHex(island.col, island.row, this.hexSide, COLOR_COAST, null);
    }

    createIslandNameButton(name, value, col, row) {
        let center = this.hexCenter(col, row);

        let buttonHeight = this.hexSide * 0.5;
        let buttonWidth = this.hexSide * 0.75;

        let x = center.x - buttonWidth / 2;
        let y = center.y - buttonHeight / 2;

        let button = this.getIslandNameButton(col, row);
        if (!button) {
            button = document.createElement("button");
            this.saveIslandNameButton(col, row, button);
            button.addEventListener("click", (e) => controller.islandNameButtonClicked(e.target));
            this.canvasContainer.appendChild(button);
        }
        button.classList = "islandName";
        button.style.width = buttonWidth + "px";
        button.style.height = buttonHeight + "px";
        button.disabled = true;
        button.innerHTML = name + (value > 0 ? "<br>" + value : "");
        button.style.fontSize = this.hexSide * 0.17 + "px";
        button.style.top = y + "px";
        button.style.left = x + "px";

        button.col = col;
        button.row = row;
    }

    createRoyalIslandButton(col, row) {
        let center = this.hexCenter(col, row);

        let buttonHeight = this.hexSide * 0.3;
        let buttonWidth = this.hexSide * 0.3;

        let x = center.x - buttonWidth / 2;
        let y = center.y - buttonHeight / 2 - this.hexSide / 3;

        let button = this.getRoyalIslandButton(col, row);
        if (!button) {
            button = document.createElement("button");
            this.saveRoyalIslandButton(col, row, button);
            button.addEventListener("click", (e) => controller.royalIslandButtonClicked(e.target));
            this.canvasContainer.appendChild(button);
        }
        button.classList = "royalIsland";
        button.style.width = buttonWidth + "px";
        button.style.height = buttonHeight + "px";
        button.disabled = true;
        button.innerHTML = "R";
        button.style.fontSize = this.hexSide * 0.17 + "px";
        button.style.top = y + "px";
        button.style.left = x + "px";

        button.col = col;
        button.row = row;
    }

    drawBeach(col, row, beachNo, beach) {
        let center = this.hexCenter(col, row);

        let context = this.context;
        context.beginPath();
        context.fillStyle = COLOR_BEACH;

        if (beach.exits.length == 1) {
            // Single beach
            let exit = beach.exits[0];
            let edgeCenter = this.hexMidEdge(col, row, exit);
            context.arc(
                edgeCenter.x, edgeCenter.y,
                this.hexSide / 3,
                0 + exit * Math.PI / 3,
                Math.PI + exit * Math.PI / 3
            );
            this.createSlotButtons(col, row, beachNo, exit, beach.ships);
        } else if (beach.exits.length == 2) {
            // Double beach
            console.assert((beach.exits[0] + 1) % 6 === beach.exits[1]);
            let cornerNo = (beach.exits[0] + 1) % 6;

            // Get the corner between the two beaches
            let cornerPoint = this.hexPoint(col, row, cornerNo);
            context.moveTo(cornerPoint.x, cornerPoint.y);
            context.arc(
                cornerPoint.x, cornerPoint.y,
                this.hexSide * 2 / 3,
                cornerNo * Math.PI / 3,
                (cornerNo+2) * Math.PI / 3
            );
            this.createSlotButtons(col, row, beachNo, beach.exits[0] + 0.5, beach.ships);
        } else {
            // Triple beach
            console.assert(beach.exits.length == 3);
            console.assert((beach.exits[0] + 1) % 6 === beach.exits[1]);
            console.assert((beach.exits[0] + 2) % 6 === beach.exits[2]);

            let exits = beach.exits;
            let points = [
                this.midPoint(
                    this.hexMidEdge(col, row, exits[0]),
                    this.hexPoint(col, row, exits[0])
                ),
                this.hexPoint(col, row, exits[1]),
                this.hexPoint(col, row, exits[2]),
                this.midPoint(
                    this.hexMidEdge(col, row, exits[2]),
                    this.hexPoint(col, row, (exits[2] + 1) % 6)
                )
            ]
            let control = this.hexMidEdge(col, row, exits[1]);
            context.moveTo(points[0].x, points[0].y);
            context.lineTo(points[1].x, points[1].y);
            context.lineTo(points[2].x, points[2].y);
            context.lineTo(points[3].x, points[3].y);
            context.arcTo(control.x, control.y,
                          points[0].x, points[0].y,
                          this.hexSide * 3 / 2);
            context.lineTo(points[1].x, points[1].y);
            this.createSlotButtons(col, row, beachNo, exits[1], beach.ships);
        }
        context.fill();

        // Create the sail buttons
        for (let exitDirection of beach.exits) {
            this.createSailButton(col, row, beachNo, exitDirection)
        }
    }

    createSlotButtons(col, row, beachNo, direction, ships) {
        let capacity = ships.length;

        let angle = direction * Math.PI / 3;
        let hexCenter = this.hexCenter(col, row);
        let r32 = Math.sqrt(3)/2;

        let x = hexCenter.x + Math.sin(angle) * this.hexSide * r32*0.75;
        let y = hexCenter.y - Math.cos(angle) * this.hexSide * r32*0.75;
        let buttonHeight = this.hexSide / 6;
        let buttonWidth = this.hexSide / 3;

        let btnGroup = this.getSlotGroup(col, row, beachNo);
        if (!btnGroup) {
            btnGroup = document.createElement("div");
            this.saveSlotGroup(col, row, beachNo, btnGroup);
            this.canvasContainer.appendChild(btnGroup);
        }
        btnGroup.classList = "beachGroup";

        // Create slot buttons
        for (let i = 0; i < capacity; i++) {
            let button = this.getSlotButton(col, row, beachNo, i);
            if (!button) {
                button = document.createElement("button");
                button.addEventListener("click", () => controller.slotButtonClicked(button));
                this.saveSlotButton(col, row, beachNo, i, button);
                btnGroup.appendChild(button);
            }
            button.classList = "slotButton";
            button.style.width = buttonWidth + "px";
            button.style.height = buttonHeight + "px";

            if (ships[i] != null) {
                button.classList = "ship";
                button.style.backgroundColor = COLOR_PLAYER[ships[i]];
            }

            button.col = col;
            button.row = row;
            button.beachNo = beachNo;
            button.slotNo = i;

        }

        // Set up slot button group
        btnGroup.style.width = buttonWidth + "px";
        btnGroup.style.height = buttonHeight * capacity + "px";
        btnGroup.style.left = x - buttonWidth/2 + "px";
        btnGroup.style.top = y - buttonHeight/2 * capacity + "px";
        btnGroup.style.transform = "rotate(" + (angle+Math.PI/2) + "rad)"
    }

    createLandingSlotGroup(col, row, ships) {
        console.assert(!document.getElementById("landingGroup"));
        let hexCenter = this.hexCenter(col, row);
        let buttonHeight = this.hexSide / 6;  // TODO: make this const
        let buttonWidth = this.hexSide / 3;

        let landingGroup = document.createElement("div");
        landingGroup.id = "landingGroup";

        // Create ship buttons
        for (let i = 0; i < ships.length; i++) {
            let button = document.createElement("button");
            button.classList = "ship landing";
            button.style.width = buttonWidth + "px";
            button.style.height = buttonHeight + "px";
            //button.style.transform = "rotate(" + (Math.random() * Math.PI * 2) + "rad)"
            button.style.backgroundColor = COLOR_PLAYER[ships[i]];
            button.draggable = true;

            button.slotNo = i;
            button.owner = ships[i];
            button.addEventListener("click", () => controller.landingShipButtonClicked(button));
            button.addEventListener("dragstart", (e) => {e.dataTransfer.setData("slotNo", button.slotNo);});

            landingGroup.appendChild(button);
        }

        landingGroup.style.width = buttonWidth + "px";
        landingGroup.style.height = buttonHeight * ships.length + "px";
        landingGroup.style.left = hexCenter.x - buttonWidth/2 + "px";
        landingGroup.style.top = hexCenter.y - buttonHeight/2 * ships.length + "px";
        //landingGroup.style.transform = "rotate(" + (Math.random() * Math.PI * 2) + "rad)"
        this.canvasContainer.appendChild(landingGroup);
    }

    deleteLandingSlotGroup() {
        let landingGroup = document.getElementById("landingGroup");
        if (landingGroup) {
            landingGroup.remove();
        }
        console.assert(document.getElementById("landingGroup") === null);
    }

    createSailButton(col, row, beachNo, exitDirection) {
        let angle = exitDirection * Math.PI / 3;
        let hexCenter = this.hexCenter(col, row);
        let r32 = Math.sqrt(3)/2;

        let x = hexCenter.x + Math.sin(angle) * this.hexSide * r32*0.9;
        let y = hexCenter.y - Math.cos(angle) * this.hexSide * r32*0.9;
        let buttonWidth = this.hexSide / 3;

        // Create sail button
        x = hexCenter.x + Math.sin(angle) * this.hexSide * r32*0.9;
        y = hexCenter.y - Math.cos(angle) * this.hexSide * r32*0.9;

        let sailButton = this.getSailButton(col, row, exitDirection);
        if (!sailButton) {
            sailButton = document.createElement("button");
            sailButton.addEventListener("click", () => controller.sailButtonClicked(sailButton));
            this.saveSailButton(col, row, exitDirection, sailButton);
            this.canvasContainer.appendChild(sailButton);
        }
        sailButton.classList = "sailButton"
        sailButton.style.width = buttonWidth + "px";
        sailButton.style.height = buttonWidth + "px";
        sailButton.style.left = x - buttonWidth/2 + "px";
        sailButton.style.top = y - buttonWidth/2 + "px";
        sailButton.style.transform = "rotate(" + (angle) + "rad)"
        sailButton.innerHTML = "^";
        sailButton.style.fontSize = this.hexSide * 0.17 + "px";
        sailButton.disabled = true;
        sailButton.col = col;
        sailButton.row = row;
        sailButton.beachNo = beachNo;
        sailButton.exitDirection = exitDirection;
    }

    addShip(col, row, beachNo, slotNo, playerNo) {
        let button = this.getSlotButton(col, row, beachNo, slotNo);
        button.style.backgroundColor = COLOR_PLAYER[playerNo];
        button.disabled = true;
        button.classList = ["ship"];
    }

    retrieveShip(col, row, beachNo, slotNo) {
        let button = this.getSlotButton(col, row, beachNo, slotNo);
        button.style.backgroundColor = null;
        button.disabled = true;
        button.classList = ["slotButton"];
    }

    emptyBeach(col, row, beachNo) {
        let slotNo = 0;
        let button;
        while (button = this.getSlotButton(col, row, beachNo, slotNo++)) {
            button.style.backgroundColor = null;
            button.disabled = true;
            button.classList = ["slotButton"];
        }
    }

    addTile(obj) {
        this.rescaleToInclude(obj.tile.col, obj.tile.row);
        controller.draw();
        this.drawTile(obj.tile);
        this.drawGrid();

        this.presentTilesLeft(obj.nrIslandsLeft, obj.nrSeaTilesLeft);
    }

    claimAsRoyalIsland(col, row, playerNo) {
        let button = this.getRoyalIslandButton(col, row);
        button.classList = ["claimedRoyalIsland"];
        button.style.backgroundColor = COLOR_PLAYER[playerNo];

        let center = this.hexCenter(col, row);
        let buttonHeight = this.hexSide / 5;
        let buttonWidth = this.hexSide / 2.5;
        let x = center.x - buttonWidth / 2;
        let y = center.y - buttonHeight / 2 - this.hexSide * 0.35;

        button.style.width = buttonWidth + "px";
        button.style.height = buttonHeight + "px";

        button.innerHTML = "";
        button.style.top = y + "px";
        button.style.left = x + "px";

        button.disabled = true;
    }

    /**
     * Configure buttons to allow only the given moves.
     */
    presentValidMoves(obj = this.validMoves) {
        this.validMoves = obj;

        // Is it your turn?
        let yourTurn = (obj.currentPlayer === controller.playerNumber)

        // Show the message
        let hint;
        if (yourTurn || obj.turnPhase === TurnPhase.GAME_OVER) {
            hint = this.getHintFromTurnPhase(obj.turnPhase);
        } else {
            hint = "Player " + obj.currentPlayer + "'s turn";
        }
        this.presentHint(hint);

        // Disable all beach slot buttons
        this.disableAllBeachSlotButtons()
        // Enable the beach slot buttons described in the object
        if (obj.beachSlots && yourTurn) {
            for (let slot of obj.beachSlots) {
                let button = this.getSlotButton(slot.col, slot.row, slot.beachNo, slot.slotNo);
                button.disabled = false;
                // Handle drops
                button.ondragover = (e => e.preventDefault());
                button.ondragenter = (e => button.classList.add("dragHover"));
                button.ondragleave = (e => button.classList.remove("dragHover"));
                button.ondrop = (e => {e.preventDefault(); controller.landingShipDraggedToSlot(e.dataTransfer.getData("slotNo"), e.target);});
            }
        }

        // Islands that can be selected for expansion
        if (obj.expandableIslands && yourTurn) {
            for (let island of obj.expandableIslands) {
                let button = this.getIslandNameButton(island.col, island.row);
                button.disabled = false;
            }
        }

        // Beaches that are ready to sail
        if (obj.beachExits) {
            for (let exit of obj.beachExits) {
                let button = this.getSailButton(
                    exit.col,
                    exit.row,
                    //exit.beachNo,  // this shouldn't be necessary
                    exit.exitDirection
                );
                if (yourTurn) {
                    button.disabled = false;
                } else {
                    button.classList.add("otherPlayerSelectable");
                }
            }
        }

        // Ships landing at island
        if (obj.landingShips) {
            this.createLandingSlotGroup(obj.landingCol, obj.landingRow, obj.landingShips);
            if (!yourTurn) {
                let landingGroup = document.querySelector("#landingGroup");
                for (let button of landingGroup.childNodes) {
                    console.log(button);
                    button.disabled = true;
                }
            }
        }

        // Claiming as royal island
        if (obj.claimableIslands && yourTurn) {
            for (let island of obj.claimableIslands) {
                let button = this.getRoyalIslandButton(island.col, island.row);
                button.disabled = false;
            }
        }
    }

    disableAllBeachSlotButtons() {
        this.applySlotButtons((b) => {
            b.disabled = true;
            b.ondragover = null;
            b.ondragenter = null;
            b.ondragleave = null;
            b.ondrop = null;
        });
        this.applyIslandNameButtons((b) => {b.disabled = true;});
        this.applyRoyalIslandButtons((b) => {b.disabled = true;});
        this.applySailButtons((b) => {b.disabled = true; b.classList.remove("otherPlayerSelectable");});
        this.deleteLandingSlotGroup();
    }

    presentHint(string) {
        this.hintView.innerHTML = string;
    }

    getHintFromTurnPhase(turnPhase) {
        switch(turnPhase) {
        case TurnPhase.INITIAL_PLACEMENT: return "Choose a beach to add a ship";
        case TurnPhase.RETRIEVE_ONE: return "Take back one of your ships so you can expand";
        case TurnPhase.CHOOSING_EXPANSION_ISLAND: return "Choose an island for expansion";
        case TurnPhase.EXPANDING: return "Choose a beach to add population to";
        case TurnPhase.READY_TO_SAIL: return "Choose a direction to sail";
        case TurnPhase.LANDING: return "Choose a beach to land on (click or drag)";
        case TurnPhase.GAME_OVER: return "Game over!";
        default: console.assert(false, "turn phase '" + turnPhase + "' cannot be handled");
        }
    }
    
    presentSupplies(supplies) {
        // Create boxes
        if (!this.suppliesBox) {
            this.suppliesBox = [];
            for (let playerNo = 0; playerNo < supplies.length; playerNo++) {
                this.suppliesBox[playerNo] = document.createElement("td");
                this.suppliesBox[playerNo].classList = ["playerBox"];
                this.suppliesBox[playerNo].innerHTML = "" + playerNo;
                this.supplyViewRow.appendChild(this.suppliesBox[playerNo]);
                this.suppliesBox[playerNo].style.color = COLOR_PLAYER[playerNo];
            }
        }
        for (let playerNo = 0; playerNo < supplies.length; playerNo++) {
            this.suppliesBox[playerNo].innerHTML = supplies[playerNo];
        }
    }

    presentCurrentPlayer(currentPlayer, nrPlayers) {
        // Create boxes
        if (nrPlayers != undefined && !this.turnBox) {
            this.turnBox = [];
            for (let playerNo = 0; playerNo < nrPlayers; playerNo++) {
                this.turnBox[playerNo] = document.createElement("td");
                this.turnBox[playerNo].classList = ["playerBox"];
                this.turnBox[playerNo].innerHTML = "" + playerNo;
                this.turnViewRow.appendChild(this.turnBox[playerNo]);
            }
        }
        // Reset colours
        for (let playerNo = 0; playerNo < this.turnBox.length; playerNo++) {
            this.turnBox[playerNo].style.color = COLOR_PLAYER[playerNo];
            this.turnBox[playerNo].style.backgroundColor = null;
            this.turnBox[playerNo].classList.remove("currentPlayer");
        }
        // Highlight current player
        this.turnBox[currentPlayer].style.backgroundColor = COLOR_PLAYER[currentPlayer];
        this.turnBox[currentPlayer].style.color = COLOR_PLAYER_CONTRAST[currentPlayer];
        this.turnBox[currentPlayer].classList.add("currentPlayer");
    }

    presentTilesLeft(nrIslandsLeft, nrSeaTilesLeft) {
        this.islandsLeftView.innerHTML = "&#x2B22;" + nrIslandsLeft;
        this.seaTilesLeftView.innerHTML = "&#x2B22;" + nrSeaTilesLeft;
    }

    gameOver(winner, finalScores, finalTilesOccupied, nrShips) {
        document.getElementById("turnViewLabel").innerHTML = "Final scores:"
        // Reset colours
        for (let playerNo = 0; playerNo < this.turnBox.length; playerNo++) {
            this.turnBox[playerNo].style.color = COLOR_PLAYER[playerNo];
            this.turnBox[playerNo].style.backgroundColor = null;
            this.turnBox[playerNo].classList.remove("currentPlayer");
            this.turnBox[playerNo].innerHTML = finalScores[playerNo];
        }
        // Highlight winner
        this.turnBox[winner].style.backgroundColor = COLOR_PLAYER[winner];
        this.turnBox[winner].style.color = COLOR_PLAYER_CONTRAST[winner];
        this.turnBox[winner].classList.add("currentPlayer");
    }

    drawHex(col, row, side, strokeColor, fillColor) {
        let context = this.context;
        context.strokeStyle = strokeColor;
        context.fillStyle = fillColor;
        context.lineWidth = this.gridLineWidth;
        context.beginPath();
        let points = [];
        for (let pointNo = 0; pointNo < 6; pointNo++) {
            points.push(this.hexPoint(col, row, pointNo));
        }
        context.moveTo(points[5].x, points[5].y);
        for (let pointNo = 0; pointNo < 6; pointNo++) {
            context.lineTo(points[pointNo].x, points[pointNo].y);
        }
        context.lineTo(points[0].x, points[0].y);
        if (fillColor) {
            context.fill();
        }
        if (strokeColor) {
            context.stroke();
        }
    }

}

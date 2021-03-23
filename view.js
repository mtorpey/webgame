const HEX_SIDE = 100;

const COLOR_EMPTYSPACE = null;
const COLOR_BACKGROUND = 'royalblue';
const COLOR_GRID = 'dodgerblue';
const COLOR_ISLAND = 'darkgreen';
const COLOR_BEACH = 'wheat';
const COLOR_PLAYER = [
    'limegreen',
    'red',
    'yellow',
    'purple',
    'orange',
    'blue'
];

const GRID_LINE_WIDTH = 10;

class View {

    slotButtons;
    islandNameButtons = new Map();
    sailButtons = new Map();

    /**
     * What to do when the model changes.
     *
     * @param obj JSON object describing the changes
     */
    modelChanged(obj) {
        console.log(obj);
        switch(obj.type) {
        case ChangeType.SHIP_ADDED: this.addShip(obj.col, obj.row, obj.beachNo, obj.slotNo, obj.playerNo); break;
        case ChangeType.BEACH_EMPTIED: this.emptyBeach(obj.col, obj.row, obj.beachNo); break;
        case ChangeType.ISLAND_SELECTED: break;  // For now, do nothing.  Highlight maybe?
        case ChangeType.TILE_ADDED: this.drawIsland(obj.tile); break;
        case ChangeType.NEXT_PLAYER: break;  // TODO: track this properly
        case ChangeType.VALID_MOVES: this.presentValidMoves(obj); break;
        default: console.assert(false, "change type '" + obj.type + "' cannot be handled");
        }
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

    saveSlotButton(col, row, beachNo, slotNo, button) {
        if (!this.slotButtons)
            this.slotButtons = [];
        if (!this.slotButtons[col])
            this.slotButtons[col] = [];
        if (!this.slotButtons[col][row])
            this.slotButtons[col][row] = [];
        if (!this.slotButtons[col][row][beachNo])
            this.slotButtons[col][row][beachNo] = [];
        this.slotButtons[col][row][beachNo][slotNo] = button;
    }

    getSlotButton(col, row, beachNo, slotNo) {
        if (this.slotButtons
            && this.slotButtons[col]
            && this.slotButtons[col][row]
            && this.slotButtons[col][row][beachNo]
            && this.slotButtons[col][row][beachNo][slotNo]) {
            return this.slotButtons[col][row][beachNo][slotNo];
        } else {
            return null;
        }
    }

    /**
     * Apply a function to every slot button in the view.
     *
     * This is a deep nested array with holes, so is a bit complicated.
     */
    applySlotButtons(f) {
        for (let column of this.slotButtons) {
            if (column) {
                for (let island of column) {
                    if (island) {
                        for (let beach of island) {
                            if (beach) {
                                for (let slotButton of beach) {
                                    f(slotButton);
                                }
                            }
                        }
                    }
                }
            }
        }
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

    saveSailButton(col, row, exitDirection, button) {
        this.sailButtons.set(col + "," + row + "," + exitDirection, button);
    }

    getSailButton(col, row, exitDirection) {
        return this.sailButtons.get(col + "," + row + "," + exitDirection);
    }

    applySailButtons(f) {
        this.sailButtons.forEach(f);
    }

    hexCenter(col, row) {
        let x = 3 / 2 * HEX_SIDE * col;
        let y = Math.sqrt(3) * HEX_SIDE * row;
        if (col % 2 == 1) {
            y += Math.sqrt(3)/2 * HEX_SIDE;
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
            x: center.x + points[pointNo].x * HEX_SIDE,
            y: center.y + points[pointNo].y * HEX_SIDE
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
        console.log(model);
        let canvas = this.canvas;
        let context = this.context;
        context.fillStyle = COLOR_BACKGROUND;
        context.fillRect(0, 0, canvas.width, canvas.height);

        for (let tile of model.tiles) {
            this.drawIsland(tile);
        }

        this.drawGrid();
    }

    drawGrid() {
        let nrCols = this.canvas.width / (HEX_SIDE * 3 / 2) + 1;
        let nrRows = this.canvas.height / (HEX_SIDE * Math.sqrt(3)) + 1;
        for (let col = 0; col < nrCols; col++) {
            for (let row = 0; row < nrRows; row++) {
                this.drawHex(col, row, HEX_SIDE, COLOR_GRID, COLOR_EMPTYSPACE);
            }
        }
    }

    drawIsland(island) {
        this.drawHex(island.col, island.row, HEX_SIDE, COLOR_GRID, COLOR_ISLAND);
        //this.writeIslandLabel(island.name, island.value, island.col, island.row);
        this.createIslandNameButton(island.name, island.value, island.col, island.row);
        for (let beachNo = 0; beachNo < island.beaches.length; beachNo++) {
            let beach = island.beaches[beachNo];
            this.drawBeach(island.col, island.row, beachNo, beach);
        }

        // Cover up those edges
        this.drawGrid();
    }

    createIslandNameButton(name, value, col, row) {
        let center = this.hexCenter(col, row);

        let buttonHeight = HEX_SIDE * 0.5;
        let buttonWidth = HEX_SIDE * 0.75;

        let x = center.x - buttonWidth / 2;
        let y = center.y - buttonHeight / 2;

        let button = document.createElement("button");
        button.classList = "islandName";
        button.style.width = buttonWidth + "px";
        button.style.height = buttonHeight + "px";
        button.disabled = true;
        button.innerHTML = name + (value > 0 ? "<br>" + value : "");
        button.style.top = y + "px";
        button.style.left = x + "px";

        button.col = col;
        button.row = row;
        button.addEventListener("click", (e) => controller.islandNameButtonClicked(e.target));
        this.saveIslandNameButton(col, row, button);
        this.canvasContainer.appendChild(button);
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
                HEX_SIDE / 3,
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
                HEX_SIDE * 2 / 3,
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
                          HEX_SIDE * 3 / 2);
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

        let x = hexCenter.x + Math.sin(angle) * HEX_SIDE * r32*0.75;
        let y = hexCenter.y - Math.cos(angle) * HEX_SIDE * r32*0.75;
        let buttonHeight = HEX_SIDE / 6;
        let buttonWidth = HEX_SIDE / 3;

        let btnGroup = document.createElement("div");
        btnGroup.classList.add("beachGroup");

        // Create slot buttons
        for (let i = 0; i < capacity; i++) {
            let button = document.createElement("button");
            button.classList = "slotButton";
            button.style.width = buttonWidth + "px";
            button.style.height = buttonHeight + "px";
            button.innerHTML = ships[i];

            button.col = col;
            button.row = row;
            button.beachNo = beachNo;
            button.slotNo = i;
            button.addEventListener("click", () => controller.slotButtonClicked(button));

            this.saveSlotButton(col, row, beachNo, i, button);
            btnGroup.appendChild(button);
        }

        // Set up slot button group
        btnGroup.style.width = buttonWidth + "px";
        btnGroup.style.height = buttonHeight * capacity + "px";
        btnGroup.style.left = x - buttonWidth/2 + "px";
        btnGroup.style.top = y - buttonHeight/2 * capacity + "px";
        btnGroup.style.transform = "rotate(" + (angle+Math.PI/2) + "rad)"
        this.canvasContainer.appendChild(btnGroup);
    }

    createLandingSlotGroup(col, row, ships) {
        console.assert(!document.getElementById("landingGroup"));
        let hexCenter = this.hexCenter(col, row);
        let buttonHeight = HEX_SIDE / 6;  // TODO: make this const
        let buttonWidth = HEX_SIDE / 3;

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
    }

    createSailButton(col, row, beachNo, exitDirection) {
        let angle = exitDirection * Math.PI / 3;
        let hexCenter = this.hexCenter(col, row);
        let r32 = Math.sqrt(3)/2;

        let x = hexCenter.x + Math.sin(angle) * HEX_SIDE * r32*0.9;
        let y = hexCenter.y - Math.cos(angle) * HEX_SIDE * r32*0.9;
        let buttonWidth = HEX_SIDE / 3;

        // Create sail button
        x = hexCenter.x + Math.sin(angle) * HEX_SIDE * r32*0.9;
        y = hexCenter.y - Math.cos(angle) * HEX_SIDE * r32*0.9;
        let sailButton = document.createElement("button");
        sailButton.classList = "sailButton"
        sailButton.style.width = buttonWidth + "px";
        sailButton.style.height = buttonWidth + "px";
        sailButton.style.left = x - buttonWidth/2 + "px";
        sailButton.style.top = y - buttonWidth/2 + "px";
        sailButton.style.transform = "rotate(" + (angle) + "rad)"
        sailButton.innerHTML = "^";
        sailButton.disabled = true;
        sailButton.col = col;
        sailButton.row = row;
        sailButton.beachNo = beachNo;
        sailButton.exitDirection = exitDirection;
        sailButton.addEventListener("click", () => controller.sailButtonClicked(sailButton));
        this.saveSailButton(col, row, exitDirection, sailButton);
        this.canvasContainer.appendChild(sailButton);
    }

    addShip(col, row, beachNo, slotNo, playerNo) {
        let button = this.getSlotButton(col, row, beachNo, slotNo);
        button.style.backgroundColor = COLOR_PLAYER[playerNo];
        button.disabled = true;
        button.classList = ["ship"];
    }

    emptyBeach(col, row, beachNo) {
        let slotNo = 0;
        let button;
        while (button = this.getSlotButton(col, row, beachNo, slotNo++)) {
            button.classList = ["slotButton"];
            button.style.backgroundColor = null;
        }
    }

    /**
     * Configure buttons to allow only the given moves.
     */
    presentValidMoves(obj) {
        // Disable all beach slot buttons
        this.applySlotButtons((b) => {
            b.disabled = true;
            b.ondragover = null;
            b.ondragenter = null;
            b.ondragleave = null;
            b.ondrop = null;
        });
        this.applyIslandNameButtons((b) => {b.disabled = true;});
        this.applySailButtons((b) => {b.disabled = true;});
        this.deleteLandingSlotGroup();
 
        // Enable the beach slot buttons described in the object
        if (obj.beachSlots) {
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
        if (obj.expandableIslands) {
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
                console.log("exit at", exit.col, exit.row, exit.exitDirection);
                button.disabled = false;
            }
        }

        // Ships landing at island
        if (obj.landingShips) {
            this.createLandingSlotGroup(obj.landingCol, obj.landingRow, obj.landingShips);
        }
    }

    drawHex(col, row, side, strokeColor, fillColor) {
        let context = this.context;
        context.strokeStyle = strokeColor;
        context.fillStyle = fillColor;
        context.lineWidth = GRID_LINE_WIDTH;
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

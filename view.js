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

    /**
     * What to do when the model changes.
     *
     * @param obj JSON object describing the changes
     */
    modelChanged(obj) {
        console.log(obj);
        switch(obj.type) {
        case ChangeType.SHIP_ADDED: this.addShip(obj.col, obj.row, obj.direction, obj.slotNo, obj.playerNo); break;
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

    saveSlotButton(col, row, direction, slotNo, button) {
        if (!this.slotButtons)
            this.slotButtons = [];
        if (!this.slotButtons[col])
            this.slotButtons[col] = [];
        if (!this.slotButtons[col][row])
            this.slotButtons[col][row] = [];
        if (!this.slotButtons[col][row][direction])
            this.slotButtons[col][row][direction] = [];
        this.slotButtons[col][row][direction][slotNo] = button;
    }

    getSlotButton(col, row, direction, slotNo) {
        return this.slotButtons[col][row][direction][slotNo];
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

        let nrCols = canvas.width / (HEX_SIDE * 3 / 2) + 1;
        let nrRows = canvas.height / (HEX_SIDE * Math.sqrt(3)) + 1;
        for (let tile of model.tiles) {
            this.drawIsland(tile);
        }
        for (let col = 0; col < nrCols; col++) {
            for (let row = 0; row < nrRows; row++) {
                this.drawHex(col, row, HEX_SIDE, COLOR_GRID, COLOR_EMPTYSPACE);
            }
        }
    }

    drawIsland(island) {
        this.drawHex(island.col, island.row, HEX_SIDE, COLOR_GRID, COLOR_ISLAND);
        this.writeIslandLabel(island.name, island.value, island.col, island.row);
        for (let beach of island.beaches) {
            this.drawBeach(island.col, island.row, beach);
        }
    }

    writeIslandLabel(name, value, col, row) {
        let center = this.hexCenter(col, row);
        this.context.font = HEX_SIDE/4 + "px Arial";
        this.context.fillStyle = 'white';
        this.context.textAlign = 'center';
        this.context.fillText(name, center.x, center.y);
        if (value > 0) {
            this.context.fillText(value, center.x, center.y + 20);
        }
    }

    drawBeach(col, row, beach) {
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
            this.createBeachButtons(col, row, exit, beach.ships);
        } else if (beach.exits.length == 2) {
            // Double beach
            console.assert(beach.exits[0] + 1 === beach.exits[1]);
            let cornerNo = beach.exits[0] + 1;

            // Get the corner between the two beaches
            let cornerPoint = this.hexPoint(col, row, cornerNo);
            context.moveTo(cornerPoint.x, cornerPoint.y);
            context.arc(
                cornerPoint.x, cornerPoint.y,
                HEX_SIDE * 2 / 3,
                cornerNo * Math.PI / 3,
                (cornerNo+2) * Math.PI / 3
            );
            this.createBeachButtons(col, row, beach.exits[0] + 0.5, beach.ships);
        } else {
            // Triple beach
            console.assert(beach.exits.length == 3);
            console.assert(beach.exits[0] + 1 === beach.exits[1]);
            console.assert(beach.exits[0] + 2 === beach.exits[2]);

            let firstExit = beach.exits[0];
            let points = [
                this.midPoint(
                    this.hexMidEdge(col, row, firstExit),
                    this.hexPoint(col, row, firstExit)
                ),
                this.hexPoint(col, row, firstExit + 1),
                this.hexPoint(col, row, firstExit + 2),
                this.midPoint(
                    this.hexMidEdge(col, row, firstExit + 2),
                    this.hexPoint(col, row, firstExit + 3)
                )
            ]
            let control = this.hexMidEdge(col, row, firstExit + 1);
            context.moveTo(points[0].x, points[0].y);
            context.lineTo(points[1].x, points[1].y);
            context.lineTo(points[2].x, points[2].y);
            context.lineTo(points[3].x, points[3].y);
            context.arcTo(control.x, control.y,
                          points[0].x, points[0].y,
                          HEX_SIDE * 3 / 2);
            context.lineTo(points[1].x, points[1].y);
            this.createBeachButtons(col, row, firstExit + 1, beach.ships);
        }
        context.fill();
    }

    createBeachButtons(col, row, direction, ships) {
        let capacity = ships.length;
        
        let angle = direction * Math.PI / 3;
        let hexCenter = this.hexCenter(col, row);
        let r32 = Math.sqrt(3)/2;

        let x = hexCenter.x + Math.sin(angle) * HEX_SIDE * r32*0.75;
        let y = hexCenter.y - Math.cos(angle) * HEX_SIDE * r32*0.75;
        let buttonHeight = HEX_SIDE / 6;
        let buttonWidth = HEX_SIDE / 3;

        let btnGroup = document.createElement("div");
        btnGroup.classList.add("btnGroup");

        for (let i = 0; i < capacity; i++) {
            let button = document.createElement("button");
            button.classList = "slotButton";
            button.style.width = buttonWidth + "px";
            button.style.height = buttonHeight + "px";
            //button.disabled = false;
            //button.style.backgroundColor = COLOR_BEACH;
            button.innerHTML = ships[i];

            button.col = col;
            button.row = row;
            button.direction = direction;
            button.slotNo = i;
            button.addEventListener("click", () => controller.beachButtonClicked(button));
            this.saveSlotButton(col, row, direction, i, button);
            btnGroup.appendChild(button);
        }

        btnGroup.style.width = buttonWidth + "px";
        btnGroup.style.height = buttonHeight * capacity + "px";
        btnGroup.style.left = x - buttonWidth/2 + "px";
        btnGroup.style.top = y - buttonHeight/2 * capacity + "px";
        btnGroup.style.transform = "rotate(" + (angle+Math.PI/2) + "rad)"
        this.canvasContainer.appendChild(btnGroup);
    }

    addShip(col, row, direction, slotNo, playerNo) {
        let button = this.getSlotButton(col, row, direction, slotNo);
        button.style.backgroundColor = COLOR_PLAYER[playerNo];
        button.disabled = true;
        button.classList = ["ship"];
    }

    /**
     * Configure buttons to allow only the given moves.
     */
    presentValidMoves(obj) {
        // Disable all beach slot buttons
        this.applySlotButtons((b) => {b.disabled = true;});

        // Enable the beach slot buttons described in the object
        for (let slot of obj.beachSlots) {
            let button = this.getSlotButton(slot.col, slot.row, slot.direction, slot.slotNo);
            button.disabled = false;
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

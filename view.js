const HEX_SIDE = 90;

const COLOR_EMPTYSPACE = null;
const COLOR_BACKGROUND = 'royalblue';
const COLOR_GRID = 'dodgerblue';
const COLOR_ISLAND = 'green';
const COLOR_BEACH = 'yellow';

const GRID_LINE_WIDTH = 10;

class View {
    
    get canvas() {
        return document.getElementById('gameCanvas');
    }

    get canvasContainer() {
        return document.getElementById('gameCanvasContainer');
    }

    get context() {
        return this.canvas.getContext('2d');
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
            console.log(tile);
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
            let exit = beach.exits[0];
            let edgeCenter = this.hexMidEdge(col, row, exit);
            context.arc(
                edgeCenter.x, edgeCenter.y,
                HEX_SIDE / 3,
                0 + exit * Math.PI / 3,
                Math.PI + exit * Math.PI / 3
            );
        } else if (beach.exits.length == 2) {
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
        } else {
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
        }
        context.fill();
        let button = document.createElement("button");
        button.classList.add("shipButton");
        button.style.top = this.hexCenter(col, row).y + "px";
        button.style.left = this.hexCenter(col, row).x + "px";
        button.style.height = HEX_SIDE / 4 + "px";
        button.innerHTML = "hello";
        this.canvasContainer.appendChild(button);
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

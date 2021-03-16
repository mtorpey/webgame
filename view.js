const HEX_SIDE = 75;

const COLOR_EMPTYSPACE = 'royalblue';
const COLOR_GRID = 'dodgerblue';
const COLOR_ISLAND = 'green';
const GRID_LINE_WIDTH = 10;

class View {
    
    get canvas() {
        return document.getElementById('gameCanvas');
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

    drawMap(model) {
        console.log(model);
        let canvas = this.canvas;
        let context = this.context;
        let nrCols = canvas.width / (HEX_SIDE * 3 / 2);
        let nrRows = canvas.height / (HEX_SIDE * Math.sqrt(3));
        for (let col = 0; col < nrCols; col++) {
            for (let row = 0; row < nrRows; row++) {
                this.drawHex(this.hexCenter(col, row), HEX_SIDE, COLOR_GRID, COLOR_EMPTYSPACE);
            }
        }
        for (let tile of model.tiles) {
            console.log(tile);
            this.drawIsland(tile.name, tile.value, tile.col, tile.row);
        }
    }

    drawIsland(name, value, col, row) {
        this.drawHex(this.hexCenter(col, row), HEX_SIDE, COLOR_GRID, COLOR_ISLAND);
        this.writeIslandLabel(name, value, col, row);
    }

    writeIslandLabel(name, value, col, row) {
        let center = this.hexCenter(col, row);
        this.context.font = "30px Arial";
        this.context.fillStyle = 'white';
        this.context.textAlign = 'center';
        this.context.fillText(name, center.x, center.y);
        this.context.fillText(value, center.x, center.y + 30);
    }

    drawHex(center, side, strokeColor, fillColor) {
        let context = this.context;
        context.strokeStyle = strokeColor;
        context.fillStyle = fillColor;
        context.lineWidth = GRID_LINE_WIDTH;
        let r32 = Math.sqrt(3)/2;
        let points = [
            {'x': -1/2, 'y': -r32},
            {'x': +1/2, 'y': -r32},
            {'x': +1,   'y': 0},
            {'x': +1/2, 'y': +r32},
            {'x': -1/2, 'y': +r32},
            {'x': -1,   'y': 0},
        ];
        let x = center['x'];
        let y = center['y'];
        context.beginPath();
        context.moveTo(x + points[0]['x']*side, y + points[0]['y']*side);
        for (let i in points) {
            context.lineTo(x + points[i]['x']*side, y + points[i]['y']*side);
        }
        context.lineTo(x + points[0]['x']*side, y + points[0]['y']*side);
        context.lineTo(x + points[1]['x']*side, y + points[1]['y']*side);
        context.fill();
        context.stroke();
    }

}

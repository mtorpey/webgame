const HEX_SIDE = 90;

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
        let nrCols = canvas.width / (HEX_SIDE * 3 / 2) + 1;
        let nrRows = canvas.height / (HEX_SIDE * Math.sqrt(3)) + 1;
        for (let col = 0; col < nrCols; col++) {
            for (let row = 0; row < nrRows; row++) {
                this.drawHex(this.hexCenter(col, row), HEX_SIDE, COLOR_GRID, COLOR_EMPTYSPACE);
            }
        }
        for (let tile of model.tiles) {
            console.log(tile);
            this.drawIsland(tile);
        }
    }

    drawIsland(island) {
        this.drawHex(this.hexCenter(island.col, island.row), HEX_SIDE, COLOR_GRID, COLOR_ISLAND);
        this.writeIslandLabel(island.name, island.value, island.col, island.row);
        for (let beach of island.beaches) {
            this.drawBeach(island.col, island.row, beach);
        }
    }

    writeIslandLabel(name, value, col, row) {
        let center = this.hexCenter(col, row);
        this.context.font = "20px Arial";
        this.context.fillStyle = 'white';
        this.context.textAlign = 'center';
        this.context.fillText(name, center.x, center.y);
        this.context.fillText(value, center.x, center.y + 20);
    }

    drawBeach(col, row, beach) {
        let center = this.hexCenter(col, row);

        let r32 = Math.sqrt(3)/2;
        let edgeCenters = [
            {'x': 0,    'y': -r32},
            {'x': +3/4, 'y': -r32/2},
            {'x': +3/4, 'y': +r32/2},
            {'x': 0,    'y': +r32},
            {'x': -3/4, 'y': +r32/2},
            {'x': -1/2, 'y': -r32/2},
        ];

        let context = this.context;
        for (let exit of beach.exits) {
            let edgeCenter = edgeCenters[exit];
            let x = edgeCenter.x * (HEX_SIDE - GRID_LINE_WIDTH/2) + center.x;
            let y = edgeCenter.y * (HEX_SIDE - GRID_LINE_WIDTH/2) + center.y;
        
            context.beginPath();
            context.fillStyle = 'yellow';
            context.arc(
                x, y,
                HEX_SIDE / 3,
                0 + exit * Math.PI / 3,
                Math.PI + exit * Math.PI / 3
            );
            context.fill();
        }
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

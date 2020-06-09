class View {
    hexSide = 30;
    
    get canvas() {
        return document.getElementById('seaMapCanvas');
    }

    get context() {
        return this.canvas.getContext('2d');
    }

    hexCenter(col, row) {
        let x = 3 / 2 * this.hexSide * col;
        let y = Math.sqrt(3) * this.hexSide * row;
        if (col % 2 == 1) {
            y += Math.sqrt(3)/2 * this.hexSide;
        }
        return {'x': x, 'y': y}
    }

    drawMap() {
        let canvas = this.canvas;
        let context = this.context;
        context.fillStyle = 'royalblue';
        context.fillRect(0, 0, canvas.width, canvas.height);
        let nrCols = canvas.width / (this.hexSide * 3 / 2);
        let nrRows = canvas.height / (this.hexSide * Math.sqrt(3));
        for (let col = 0; col < nrCols; col++) {
            for (let row = 0; row < nrRows; row++) {
                this.drawHex(this.hexCenter(col, row), this.hexSide);
            }
        }
    }

    drawHex(center, side) {
        let context = this.context;
        context.strokeStyle = 'white';
        context.lineWidth = '1';
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
        context.stroke();
    }

    drawShip(ship) {
        let context = this.context;
        context.strokeStyle = 'brown';
        context.lineWidth = '20';
        let front = this.hexCenter(ship.bowHex.col, ship.bowHex.row);
        let back = this.hexCenter(ship.sternHex.col, ship.sternHex.row);
        context.beginPath();
        context.moveTo(front['x'], front['y']);
        context.lineTo(back['x'], back['y']);
        context.stroke();

        context.strokeStyle = 'white';
        context.lineWidth = '5';
        context.beginPath();
        context.arc(front['x'], front['y'], 3, 0, Math.PI * 2, true);
        context.stroke();
        //context.fillRect(front['x']-5, front['y']-5, 10, 10);
    }
}

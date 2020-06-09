class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }
    
    draw() {
        this.view.drawMap();
        let allShips = this.model.allShips;
        for (let i in allShips) {
            this.view.drawShip(allShips[i]);
        }
    }

    nextMoveSubmitted() {
        // Get move string from user
        let nextMoveInput = document.getElementById('nextMoveInput');
        let nextMoveString = nextMoveInput.value;

        // Replace input with fixed string
        nextMoveInput.parentNode.innerHTML = nextMoveString;
        let nextMoveButton = document.getElementById('nextMoveButton');
        nextMoveButton.parentNode.removeChild(nextMoveButton);

        // Process move
        this.model.movementExecutionPhase(nextMoveString);

        // Update display
        this.draw();
    }
}

controller = new Controller(new Model(), new View());

class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }
    
    draw() {
        this.view.drawMap(this.model);
    }

    nextMoveSubmitted() {
        // Update display
        this.draw();
    }
}


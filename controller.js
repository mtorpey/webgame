class Controller {
    model;
    view;
    
    constructor(model, view) {
        this.model = model;
        this.view = view;
        model.registerChangeListener(view);
    }
    
    draw() {
        this.view.drawMap(this.model);
    }

    beachButtonClicked(button) {
        switch(this.model.turnPhase) {
        case TurnPhase.INITIAL_PLACEMENT:
            this.initialPlacement(button.direction, button.slotNo);
        }
        button.blur();
    }

    initialPlacement(direction, slotNo) {
        // TODO: pass in player number for verification?
        this.model.initialPlacement(direction, slotNo);
    }
}


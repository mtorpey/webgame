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

    slotButtonClicked(button) {
        switch(this.model.turnPhase) {
        case TurnPhase.INITIAL_PLACEMENT:
            this.initialPlacement(button.beachNo, button.slotNo); break;
        case TurnPhase.EXPANDING:
            this.expandAtSlot(button.beachNo, button.slotNo); break;
        default: console.assert(false, "beach button click in phase '" + this.model.turnPhase + "' cannot be handled");
        }
        button.blur();
    }

    sailButtonClicked(button) {
        console.log(button.col, button.row, button.beachNo, button.exitDirection);
        button.blur();
    }

    islandNameButtonClicked(button) {
        this.model.chooseExpansionIsland(button.col, button.row);
        button.blur();
    }

    initialPlacement(beachNo, slotNo) {
        // TODO: pass in player number for verification?
        this.model.initialPlacement(beachNo, slotNo);
    }

    expandAtSlot(beachNo, slotNo) {
        // Note: expansion island already chosen, so don't need col and row.
        this.model.expandAtSlot(beachNo, slotNo);
    }
}


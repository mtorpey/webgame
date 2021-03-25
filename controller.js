class Controller {
    model;
    view;

    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.draw();
        model.registerChangeListener(view);
    }

    draw() {
        this.view.drawMap(this.model);
    }

    deleteButtons() {
        this.view.deleteAllButtons();
    }

    slotButtonClicked(button) {
        switch(this.model.turnPhase) {
        case TurnPhase.INITIAL_PLACEMENT:
            this.initialPlacement(button.beachNo, button.slotNo); break;
        case TurnPhase.RETRIEVE_ONE:
            this.model.retrieveOne(button.col, button.row, button.beachNo, button.slotNo); break;
        case TurnPhase.EXPANDING:
            this.expandAtSlot(button.beachNo, button.slotNo); break;
        case TurnPhase.LANDING:
            this.model.landShip(0, button.beachNo, button.slotNo); break;  // First ship
        default: console.assert(false, "beach button click in phase '" + this.model.turnPhase + "' cannot be handled");
        }
        button.blur();
    }

    sailButtonClicked(button) {
        this.model.sailFromExit(button.col, button.row, button.exitDirection);
        button.blur();
    }

    islandNameButtonClicked(button) {
        this.model.chooseExpansionIsland(button.col, button.row);
        button.blur();
    }

    landingShipButtonClicked(button) {
        console.log("Ship " + button.slotNo + " of color " + button.owner + " trying to land");
        button.blur();
    }

    landingShipDraggedToSlot(landingGroupSlotNo, slotButton) {
        this.model.landShip(landingGroupSlotNo, slotButton.beachNo, slotButton.slotNo);
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


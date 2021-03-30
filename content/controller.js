"use strict";

var controller;

window.onload = function() {
    controller = new Controller(new View());
}

//
// CONST ENUMS: make sure these are the same as in model.js
//
const TurnPhase = {
    INITIAL_PLACEMENT: "initial placement",  // place 2 ships each on Tonga
    RETRIEVE_ONE: "retrieve one",  // empty supply, so grab one ship before expansion
    CHOOSING_EXPANSION_ISLAND: "choosing expansion island",  // choose an island to expand (or royal/special)
    EXPANDING: "expanding",  // choose the beaches to place your new ships
    READY_TO_SAIL: "ready to sail",  // choose a beach to sail from
    LANDING: "landing",  // choose which beaches the ships land on
    GAME_OVER: "game over"
}

const ChangeType = {
    SHIP_ADDED: "ship added",
    SHIP_RETRIEVED: "ship retrieved",
    BEACH_EMPTIED: "beach emptied",
    ISLAND_SELECTED: "island selected",  // for expansion
    TILE_ADDED: "tile added",
    ROYAL_ISLAND_CLAIMED: "royal island claimed",
    SUPPLIES_CHANGED: "supplies changed",
    NEXT_PLAYER: "next player",
    VALID_MOVES: "valid moves",
    GAME_OVER: "game over"
}

const ActionType = {
    INITIAL_PLACEMENT: "initial placement",
    RETRIEVE_ONE: "retrieve one",
    SAIL_FROM_EXIT: "sail from exit",
    CHOOSE_EXPANSION_ISLAND: "choose expansion island",
    CLAIM_AS_ROYAL_ISLAND: "claim as royal island",
    LAND_SHIP: "land ship",
    EXPAND_AT_SLOT: "expand at slot"
}

//
// controller class
//
class Controller {
    socket;
    view;

    latestModel;

    constructor(view) {
        this.view = view;
        this.socket = io();

        this.socket.on("server_says", (message) => {
            console.log("Server says", message);
        });

        this.socket.on("change", obj => this.view.modelChanged(obj));

        this.socket.on("model", model => {this.latestModel = model; this.view.drawMap(model);});

        this.draw();
    }

    sendAction(obj) {
        console.log("sending action", obj);
        this.socket.emit("action", obj);
    }

    draw() {
        console.log("requesting latest model");
        this.socket.emit("request-model");
    }

    deleteButtons() {
        this.view.deleteAllButtons();
    }

    slotButtonClicked(button) {
        switch(this.view.validMoves.turnPhase) {
        case TurnPhase.INITIAL_PLACEMENT:
            this.initialPlacement(button.beachNo, button.slotNo); break;
        case TurnPhase.RETRIEVE_ONE:
            this.retrieveOne(button.col, button.row, button.beachNo, button.slotNo); break;
        case TurnPhase.EXPANDING:
            this.expandAtSlot(button.beachNo, button.slotNo); break;
        case TurnPhase.LANDING:
            this.landShip(0, button.beachNo, button.slotNo); break;  // First ship
        default: console.assert(false, "beach button click in phase '" + this.model.turnPhase + "' cannot be handled");
        }
        button.blur();
    }

    initialPlacement(beachNo, slotNo) {
        this.sendAction({
            type: ActionType.INITIAL_PLACEMENT,
            beachNo: beachNo,
            slotNo: slotNo
        });
    }

    retrieveOne(col, row, beachNo, slotNo) {
        this.sendAction({
            type: ActionType.RETRIEVE_ONE,
            col: col,
            row: row,
            beachNo: beachNo,
            slotNo: slotNo
        });
    }

    sailButtonClicked(button) {
        this.sendAction({
            type: ActionType.SAIL_FROM_EXIT,
            col: button.col,
            row: button.row,
            direction: button.exitDirection
        });
        button.blur();
    }

    islandNameButtonClicked(button) {
        this.sendAction({
            type: ActionType.CHOOSE_EXPANSION_ISLAND,
            col: button.col,
            row: button.row
        });
        button.blur();
    }

    royalIslandButtonClicked(button) {
        this.sendAction({
            type: ActionType.CLAIM_AS_ROYAL_ISLAND,
            col: button.col,
            row: button.row
        });
    }

    landingShipButtonClicked(button) {
        // Do nothing
        console.log("Ship " + button.slotNo + " of color " + button.owner + " trying to land");
        button.blur();
    }

    landingShipDraggedToSlot(landingShipNo, slotButton) {
        this.landShip(landingShipNo, slotButton.beachNo, slotButton.slotNo);
    }

    landShip(landingShipNo, beachNo, slotNo) {
        this.sendAction({
            type: ActionType.LAND_SHIP,
            landingShipNo: landingShipNo,
            beachNo: beachNo,
            slotNo: slotNo
        });
    }

    expandAtSlot(beachNo, slotNo) {
        // Note: expansion island already chosen, so don't need col and row.
        this.sendAction({
            type: ActionType.EXPAND_AT_SLOT,
            beachNo: beachNo,
            slotNo: slotNo
        });
    }
}

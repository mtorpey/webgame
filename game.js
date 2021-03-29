"use strict";

var controller;

window.onload = function() {
    controller = new Controller(new Model(["Alice", "Bob", "Charlie", "Denise", "Egbert", "Fredwina"]), new View());
}

//
// SERVER SOCKETS for multi-client play
//
/*
var socket = io();

socket.on("updated_model", (newModel) => {
    apple.innerHTML = "Server sent model " + (++nr_updates);
    model = new Model(newModel);
    displayGame(model);
});
*/

var controller;

window.onload = function() {
    controller = new Controller(new Model(["Alice", "Bob", "Charlie", "Demelza"]), new View());
    controller.draw();
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

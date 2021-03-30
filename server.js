"use strict";

var modelClass = require('./model.js');

var express = require('express');
var app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const SERVER_PORT = 3000;

// Serve all pages from "content"
app.use(express.static('content/'));

// Create a game
var model = new modelClass.Model([
    "Alice",
    //"Bob",
    //"Charlie",
    //"Denise",
    //"Egbert",
    "Fred"
]);

// Create sockets with new clients
io.on('connection', (socket) => {
    console.log('a user connected');

    let send_to_client = function(type, obj) {
        io.emit(type, obj);
    }

    model.registerListener(send_to_client);

    // Listen: client sends a move
    socket.on('message', (string) => {
        console.log('client says', string);

        setTimeout(function() {
            io.emit("server_says", "hello world");
            //socket.broadcast.emit("server announce", "You are the others");
        }, 1);
    });

    socket.on("action", obj => model.applyAction(obj));
    socket.on("request-model", () => model.broadcastModel());

    // Client disconnects
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

// listen for connections
http.listen(SERVER_PORT, () => {
    console.log(`Listening on localhost:${SERVER_PORT}`)
});

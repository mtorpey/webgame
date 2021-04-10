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
//var model = new modelClass.Model([
    //"Alice",
    //"Bob",
    //"Charlie",
    //"Denise",
    //"Egbert",
    //"Fred"
//]);

var openGames = [];
var nextGameNo = 0;
addGame();

function addGame() {
    openGames.push(nextGameNo++);
}

function openGameInfo() {
    let out = [];
    for (let gameNumber of openGames) {
        out.push({number: gameNumber, playerNames: allPlayerNamesInRoom("game-" + gameNumber)});
    }
    return out;
}

function allSocketsInRoom(roomName) {
    let ids = [];
    let sockets = [];
    let room = io.of("/").adapter.rooms.get(roomName)
    if (room) {
        room.forEach(id => ids.push(id));
    }
    for (let id of ids) {
        sockets.push(io.of("/").sockets.get(id));
    }
    return sockets;
}

function allPlayerNamesInRoom(roomName) {
    let names = [];
    for (let socket of allSocketsInRoom(roomName)) {
        names.push(socket.playerName);
    }
    return names;
}

function broadcastOpenGameInfo() {
    console.log("ALL IN LOBBY", allPlayerNamesInRoom("lobby"));
    let info = openGameInfo();
    io.emit("open-games", info);
    for (let game of openGames) {
        io.to("game-" + game.number).emit("open-games", info);
    }
}

function joinGame(gameNumber, socket) {
    socket.join("game-" + gameNumber);
    socket.emit("joined", gameNumber);
    broadcastOpenGameInfo()
}

function tryToStartGame(gameNumber) {
    let sendToAllPlayers = function(type, obj) {
        io.to("game-" + gameNumber).emit(type, obj);
    }
    let game = new modelClass.Model(allPlayerNamesInRoom("game-" + gameNumber));
    for (let socket of allSocketsInRoom("game-" + gameNumber)) {
        socket.game = game;
        socket.leave("lobby");
    }
    game.registerListener(sendToAllPlayers);
}

// Create sockets with new clients
io.on('connection', (socket) => {
    console.log('a user connected');


    let send_to_client = function(type, obj) {
        socket.emit(type, obj);
    }

    //model.registerListener(send_to_client);

    // Listen: client sends a move
    socket.on('message', (string) => {
        console.log('client says', string);

        setTimeout(function() {
            io.emit("server_says", "hello world");
            //socket.broadcast.emit("server announce", "You are the others");
        }, 1);
    });

    socket.on("player-name", name => {socket.playerName = name; socket.join("lobby"); console.log(socket.playerName); broadcastOpenGameInfo();});;
    socket.on("join", gameNumber => joinGame(gameNumber, socket));
    socket.on("start", gameNumber => tryToStartGame(gameNumber));
    socket.on("action", obj => socket.game.applyAction(obj));
    socket.on("request-model", () => socket.game.broadcastModel());

    // Client disconnects
    socket.on('disconnect', () => {
        console.log('user disconnected');
        broadcastOpenGameInfo();
    });
});

// listen for connections
http.listen(SERVER_PORT, () => {
    console.log(`Listening on localhost:${SERVER_PORT}`)
});

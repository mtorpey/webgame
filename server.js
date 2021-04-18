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

var gamesInProgress = [];

function addGame() {
    // TODO: move out of other games when joining one
    openGames.push(nextGameNo++);
    broadcastOpenGameInfo();
}

function openGameInfo() {
    let out = [];
    for (let gameNumber of openGames) {
        let playerNames = allPlayerNamesInRoom("game-" + gameNumber);
        let canStartYet = (playerNames.length > 1);
        out.push({number: gameNumber, playerNames: playerNames, canStartYet: canStartYet});
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
    io.to("lobby").emit("open-games", info);
    for (let game of openGames) {
        io.to("game-" + game.number).emit("open-games", info);
    }
}

function joinGame(gameNumber, socket) {
    if (allSocketsInRoom("game-" + gameNumber).length < 6) {
        socket.join("game-" + gameNumber);
        socket.emit("joined", gameNumber);
        broadcastOpenGameInfo()
    }
}

function tryToStartGame(gameNumber) {
    let sendToAllPlayers = function(type, obj) {
        io.to("game-" + gameNumber).emit(type, obj);
    }
    let game = new modelClass.Model(allPlayerNamesInRoom("game-" + gameNumber));
    let sockets = allSocketsInRoom("game-" + gameNumber);
    for (let playerNumber = 0; playerNumber < sockets.length; playerNumber++) {
        sockets[playerNumber].game = game;
        sockets[playerNumber].leave("lobby");
        sockets[playerNumber].emit("game-started", playerNumber);
    }
    game.registerListener(sendToAllPlayers);
    openGames.splice(openGames.indexOf(gameNumber), 1);  // Remove game
    gamesInProgress[gameNumber] = game;
    broadcastOpenGameInfo();
}

function applyAction(socket, obj) {
    gamesInProgress[obj.gameNumber].applyAction(obj);

    // Socket seems to think it's in this game, so add it if necessary
    // (this maybe helps recover from disconnects?)
    socket.join("game-" + obj.gameNumber);
}

function broadcastModel(socket, gameNumber) {
    gamesInProgress[gameNumber].broadcastModel();

    // Socket seems to think it's in this game, so add it if necessary
    // (this maybe helps recover from disconnects?)
    socket.join("game-" + obj.gameNumber);
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
    socket.on("add-game", () => addGame());
    socket.on("join", gameNumber => joinGame(gameNumber, socket));
    socket.on("start", gameNumber => tryToStartGame(gameNumber));
    socket.on("action", obj => applyAction(socket, obj));
    socket.on("request-model", gameNumber => broadcastModel(socket, gameNumber));

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

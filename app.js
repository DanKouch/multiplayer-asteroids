"use strict";

// Config
const COLORS = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple"];
const MAX_PLAYERS_PER_SESSION = 8;

// Imports
const express = require('express');
const shortId = require('shortid');
const escape = require('escape-html');
const profanityCensor = require('profanity-censor');
const app = express();

// Webserver Connections
app.set('port', process.env.PORT || 3000);

const server = app.listen(app.get('port'), function () {
  console.log('HTTP server running on port ' + app.get('port'));
});

const io = require('socket.io').listen(server);

app.use(express.static('public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// Websocket Connections
io.on('connection', function(socket){
  socket.on('username', function(unsafeUsername){
    let safeUsername = profanityCensor.filter(escape(unsafeUsername));
    if(usernameOk(safeUsername)){
      getSessionToJoin(socket).addClient(socket, safeUsername);
    }else{
      socket.emit("err", "Bad username");
    }
  })
})

function usernameOk(username){
  return (username.trim() !== "" && username !== "null");
}

function getSessionToJoin(socket){
  let sessionToConnect = sessions.find((session) => session.clients.length < MAX_PLAYERS_PER_SESSION);
  if(!sessionToConnect){
    sessionToConnect = sessions[sessions.push(new session())-1];
  }
  return sessionToConnect;
}

// Set up sessions
function session(){
  this.id = shortId.generate();
  this.clients = [];
  this.tick = setInterval(this.sendPackets.bind(this), 10);

  console.log("New session created with id " + this.id);
}

session.prototype.addClient = function(socket, username){

  // Actually add the user
  let index = this.clients.push(socket);

  // Configure player information
  socket.publicPlayerInfo = {
    username: username,
    color: COLORS[index-1],
    id: shortId.generate(),
    position: {
      x: 0,
      y: 0
    }
  };

  socket.privatePlayerInfo = {
    health: 100
  }

  console.log("User " + socket.publicPlayerInfo.username + " (" + socket.publicPlayerInfo.id + ") connected to session " + this.id);

  // Gather client controls
  let sessionID = this.id;
  let clients = this.clients;

  socket.on('key press event', function(e){
    shortId.generate();
    console.log("User " + socket.publicPlayerInfo.username + " (" + socket.publicPlayerInfo.id + ") on session " + sessionID + " has " + (e.pressed ? "pressed" : "released") + " key " + e.key);
  });

  socket.on('mouse press event', function(e){
    console.log("User " + socket.publicPlayerInfo.username + " (" + socket.publicPlayerInfo.id + ") on session " + sessionID + " has " + (e.pressed ? "pressed" : "released") + " their mouse");
  });

  socket.on('disconnect', function(){
    clients.splice(clients.indexOf(socket));
    console.log("User " + socket.publicPlayerInfo.username + " (" + socket.publicPlayerInfo.id + ") on session " + sessionID + " has disconnected");
  });
}

// Session object declaration
session.prototype.sendPackets = function(){
  this.clients.forEach((clientToSendTo) => {
    clientToSendTo.emit("server packet", {
      players: this.clients.filter((x) => (x.id !== clientToSendTo.id)).map((x) => x.publicPlayerInfo),
      sessionID: this.id,
      you: {
        publicPlayerInfo: clientToSendTo.publicPlayerInfo,
        privatePlayerInfo: clientToSendTo.privatePlayerInfo
      }
    });
  });

}

const sessions = [new session()];

"use strict";

// Imports
const config = require("./config.js");
const express = require('express');
const shortId = require('shortid');
const escape = require('escape-html');
const profanityCensor = require('profanity-censor');
const app = express();

const sessions = [];

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
  socket.on('login', function(loginObject){
    let loginResponse = {
      successful: true
    };

    // Check usernmame
    let safeUsername = profanityCensor.filter(escape(loginObject.username));
    if(!usernameOk(safeUsername)){
      loginResponse.successful = false;
      loginResponse.usernameError = "Please select another username."
    }

    let sessionToJoin;
    if(loginObject.sessionId.trim() !== ""){
      // Custom session option
      sessionToJoin = sessions.find((x) => {
        return (x.id === loginObject.sessionId.trim()) && x.canJoin();
      });
      if(sessionToJoin === undefined){
        loginResponse.successful = false;
        loginResponse.sessionIdError = "No session with that ID exists."
      }
    } else {
      // "Default" Option
      sessionToJoin = getSessionToJoin(socket);
    }

    if(loginResponse.successful){
      sessionToJoin.addClient(socket, safeUsername);
    }
    socket.emit("login response", loginResponse);
  })
})

function usernameOk(username){
  return (username.trim() !== "" && username !== "null");
}

function getSessionToJoin(socket){
  let sessionToConnect = sessions.find((session) => session.clients.length < config.maxPlayersPerSession);
  if(!sessionToConnect){
    sessionToConnect = sessions[sessions.push(new session())-1];
  }
  return sessionToConnect;
}

// Set up sessions
function session(){
  this.id = shortId.generate();
  this.clients = [];
  this.tick = setInterval(this.logic.bind(this), 10);

  console.log("New session created with id " + this.id);
}

session.prototype.addClient = function(socket, username){

  // Configure player information
  socket.publicPlayerInfo = {
    username: username,
    colorIdentifier: this.getColorIdentifier(),
    directionIdentifier: 0,
    id: shortId.generate(),
    position: {
      x: 0,
      y: 0
    }
  };

  socket.privatePlayerInfo = {
    health: 100,
    velocity: {
      x: 0,
      y: 0
    }
  }

  socket.keysPressed = [];
  socket.mouseInfo = {
    pressed: false
  }

  // Actually add the user
  let index = this.clients.push(socket);

  console.log("User " + socket.publicPlayerInfo.username + " (" + socket.publicPlayerInfo.id + ") connected to session " + this.id);

  // Gather client controls
  let _this = this;

  socket.on('key press event', function(e){
    shortId.generate();

    if(e.pressed){
      if(socket.keysPressed.indexOf(e.key) === -1){
		  	socket.keysPressed.push(e.key);
		  }
    }else{
      if(socket.keysPressed.indexOf(e.key) !== -1){
		  	socket.keysPressed.splice(socket.keysPressed.indexOf(e.key), 1);
		  }
    }
  });

  socket.on('mouse press event', function(e){
    socket.mouseInfo.pressed = e.pressed;
  });

  socket.on('disconnect', function(){
    _this.clients.splice(_this.clients.indexOf(socket), 1);
    console.log("User " + socket.publicPlayerInfo.username + " (" + socket.publicPlayerInfo.id + ") on session " + _this.id + " has disconnected");
    if(_this.clients.length < 1){
      sessions.splice(sessions.indexOf(_this), 1);
      console.log("Session with id " + _this.id + " has been deleted");
    }
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

session.prototype.canJoin = function(){
  return this.clients.length < config.maxPlayersPerSession;
}

session.prototype.getColorIdentifier = function(){
  let possibilities = [];
  for(let i = 0; i < config.maxPlayersPerSession; i++){
    possibilities.push(i);
  }
  let alreadyUsed = this.clients.map((x) => x.publicPlayerInfo.colorIdentifier);
  let yetToBeUsed = possibilities.filter((y) => alreadyUsed.indexOf(y) === -1);
  return yetToBeUsed[Math.floor(Math.random() * yetToBeUsed.length)];
}

session.prototype.logic = function(){
  this.clients.forEach((player) => {

    /*
    Direction Identifiers:
    IDLE: 0
    UP: 4
    DOWN: 1
    LEFT: 2
    RIGHT: 3
    */

    let lastPressed = player.keysPressed.slice().reverse().find((key) => ["W", "A", "S", "D"].indexOf(key) !== -1);

    if(lastPressed === "W"){
      player.publicPlayerInfo.directionIdentifier = 4;
    }else if(lastPressed === "A"){
      player.publicPlayerInfo.directionIdentifier = 2;
    }else if(lastPressed === "S"){
      player.publicPlayerInfo.directionIdentifier = 1;
    }else if(lastPressed === "D"){
      player.publicPlayerInfo.directionIdentifier = 3;
    }else{
      player.publicPlayerInfo.directionIdentifier = 0;
    }

    if(player.keysPressed.indexOf("W") !== -1){
      player.privatePlayerInfo.velocity.y-=config.jetpackPower;
    }
    if(player.keysPressed.indexOf("A") !== -1){
      player.privatePlayerInfo.velocity.x-=config.jetpackPower;
    }
    if(player.keysPressed.indexOf("S") !== -1){
      player.privatePlayerInfo.velocity.y+=config.jetpackPower;
    }
    if(player.keysPressed.indexOf("D") !== -1){
      player.privatePlayerInfo.velocity.x+=config.jetpackPower;
    }

    if(player.privatePlayerInfo.velocity.x > 0){
      player.privatePlayerInfo.velocity.x -= config.ambientFriction;
    }else if(player.privatePlayerInfo.velocity.x < 0){
      player.privatePlayerInfo.velocity.x += config.ambientFriction;
    }

    if(player.privatePlayerInfo.velocity.y > 0){
      player.privatePlayerInfo.velocity.y -= config.ambientFriction;
    }else if(player.privatePlayerInfo.velocity.y < 0){
      player.privatePlayerInfo.velocity.y += config.ambientFriction;
    }

    if(Math.abs(player.privatePlayerInfo.velocity.x) <= config.ambientFriction && Math.abs(player.privatePlayerInfo.velocity.y) <= config.ambientFriction){
      player.privatePlayerInfo.velocity.x = 0;
      player.privatePlayerInfo.velocity.y = 0;
    }

    player.publicPlayerInfo.position.x += player.privatePlayerInfo.velocity.x;
    player.publicPlayerInfo.position.y += player.privatePlayerInfo.velocity.y;
  });

  this.sendPackets();
}

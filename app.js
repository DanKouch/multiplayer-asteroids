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
    if(usernameOk(safeUsername)){

    }else{

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
  this.tick = setInterval(this.logic.bind(this), 10);

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

  console.log("User " + socket.publicPlayerInfo.username + " (" + socket.publicPlayerInfo.id + ") connected to session " + this.id);

  // Gather client controls
  let sessionID = this.id;
  let clients = this.clients;

  socket.on('key press event', function(e){
    shortId.generate();
    console.log("User " + socket.publicPlayerInfo.username + " (" + socket.publicPlayerInfo.id + ") on session " + sessionID + " has " + (e.pressed ? "pressed" : "released") + " key " + e.key);

    if(e.pressed){
      if(socket.keysPressed.indexOf(e.key) === -1){
		  	socket.keysPressed.push(e.key);
		  }
    }else{
      if(socket.keysPressed.indexOf(e.key) !== -1){
		  	socket.keysPressed.splice(socket.keysPressed.indexOf(e.key));
		  }
    }
  });

  socket.on('mouse press event', function(e){
    console.log("User " + socket.publicPlayerInfo.username + " (" + socket.publicPlayerInfo.id + ") on session " + sessionID + " has " + (e.pressed ? "pressed" : "released") + " their mouse");
    socket.mouseInfo.pressed = e.pressed;
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

session.prototype.canJoin = function(){
  return this.clients.length < MAX_PLAYERS_PER_SESSION;
}

session.prototype.logic = function(){
  this.clients.forEach((player) => {
    if(player.keysPressed.indexOf("W") !== -1){
      player.privatePlayerInfo.velocity.y-=0.2;
    }
    if(player.keysPressed.indexOf("A") !== -1){
      player.privatePlayerInfo.velocity.x-=0.2;
    }
    if(player.keysPressed.indexOf("S") !== -1){
      player.privatePlayerInfo.velocity.y+=0.2;
    }
    if(player.keysPressed.indexOf("D") !== -1){
      player.privatePlayerInfo.velocity.x+=0.2;
    }

    if(player.privatePlayerInfo.velocity.x > 0){
      player.privatePlayerInfo.velocity.x -= 0.05;
    }else if(player.privatePlayerInfo.velocity.x < 0){
      player.privatePlayerInfo.velocity.x += 0.05;
    }

    if(player.privatePlayerInfo.velocity.y > 0){
      player.privatePlayerInfo.velocity.y -= 0.05;
    }else if(player.privatePlayerInfo.velocity.y < 0){
      player.privatePlayerInfo.velocity.y += 0.05;
    }

    if(Math.abs(player.privatePlayerInfo.velocity.x) <= 0.05){
      player.privatePlayerInfo.velocity.x = 0;
    }

    if(Math.abs(player.privatePlayerInfo.velocity.y) <= 0.05){
      player.privatePlayerInfo.velocity.y = 0;
    }

    player.publicPlayerInfo.position.x += player.privatePlayerInfo.velocity.x;
    player.publicPlayerInfo.position.y += player.privatePlayerInfo.velocity.y;
  });

  this.sendPackets();
}

const sessions = [new session()];

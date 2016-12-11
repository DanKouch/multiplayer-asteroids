"use strict";

// Imports
const config = require("./config.js");
const Player = require("./gameObjects/Player.js");
const Session = require("./gameObjects/Session.js");
const express = require('express');
const escape = require('escape-html');
const winston = require("winston");
const app = express();

// Set up logging
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {'timestamp':true});
winston.add(winston.transports.File, { filename: 'multiplayerAsteroids.log', 'timestamp':true});

Session.winston = winston;

const sessions = [];

// Webserver Connections
app.set('port', process.env.PORT || 3000);

const server = app.listen(app.get('port'), function () {
  winston.info('HTTP server running on port ' + app.get('port'));
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
    let safeUsername = escape(loginObject.username).substring(0, 8);
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
      sessionToJoin.addPlayer(new Player(socket, safeUsername));
    }

    socket.emit("login response", loginResponse);
  })
})

function usernameOk(username){
  return (username.trim() !== "" && username !== "null");
}

function getSessionToJoin(socket){
  let sessionToConnect = sessions.find((session) => session.players.length < config.maxPlayersPerSession);
  if(!sessionToConnect){
    sessionToConnect = sessions[sessions.push(new Session())-1];
    winston.info("New session created with id " + sessionToConnect.id);
  }
  return sessionToConnect;
}

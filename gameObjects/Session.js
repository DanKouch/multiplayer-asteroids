"use strict";

// Imports
const config = require("../config.js");
const shortId = require('shortid');

let Session = function(){
  this.id = shortId.generate();
  this.players = [];
  this.tick = setInterval(this.logic.bind(this), 10);
}

Session.prototype.addPlayer = function(player){
  player.public.colorIdentifier = this.getColorIdentifier();

  this.players.push(player);
  Session.winston.info("User " + player.public.username + " (" + player.public.id + ") connected to session " + this.id);

  let _this = this;

  player.socket.on('disconnect', function(){
    _this.players.splice(_this.players.indexOf(player), 1);
    Session.winston.info("User " + player.public.username + " (" + player.public.id + ") on session " + _this.id + " has disconnected");
    if(_this.players.length < 1){
      _this.splice(_this.indexOf(player), 1);
      Session.winston.info("Session with id " + _this.id + " has been deleted");
    }
  });
}


Session.prototype.sendPackets = function(){
  this.players.forEach((playerToSendTo) => {
    playerToSendTo.socket.emit("server packet", {
      players: this.players.filter((x) => (x.public.id !== playerToSendTo.public.id)).map((x) => x.public),
      sessionID: this.id,
      you: {
        public: playerToSendTo.public,
        private: playerToSendTo.private
      }
    });
  });

}

Session.prototype.canJoin = function(){
  return this.players.length < config.maxPlayersPerSession;
}

Session.prototype.getColorIdentifier = function(){
  let possibilities = [];
  for(let i = 0; i < config.maxPlayersPerSession; i++){
    possibilities.push(i);
  }
  let alreadyUsed = this.players.map((x) => x.public.colorIdentifier);
  let yetToBeUsed = possibilities.filter((y) => alreadyUsed.indexOf(y) === -1);
  return yetToBeUsed[Math.floor(Math.random() * yetToBeUsed.length)];
}

Session.prototype.logic = function(){
  this.players.forEach((player) => {
    player.logic();
  });

  this.sendPackets();
}

module.exports = Session;

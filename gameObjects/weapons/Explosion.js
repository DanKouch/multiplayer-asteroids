"use strict";

// Imports
const config = require("../../config.js");

let Explosion = function(damage, pos, vel){
  this.position = pos.add(vel);
  this.velocity = vel;
  this.timeLeft = config.explosionLife;
  this.damage = damage;
  this.type = "explosion";
}

Explosion.prototype.logic = function(session){
  // Movement
  this.position.add(this.velocity);
  this.timeLeft--;
  if(this.timeLeft <= 0){
    session.gameObjects.splice(session.gameObjects.indexOf(this), 1);

    // Collision Detection
    session.players.forEach((player) => {
      if(Math.hypot((this.position.x - player.public.position.x), (this.position.y - player.public.position.y)) < config.explosionRadius){
        player.removeHealth(this.damage);
      }
    });
  }
}

module.exports = Explosion;

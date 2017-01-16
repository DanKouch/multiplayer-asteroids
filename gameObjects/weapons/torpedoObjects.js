"use strict";

// Imports
const config = require("../../config.js");
const shortId = require('shortid');
const Explosion = require("./Explosion.js");

let torpedoObjects = {};

torpedoObjects.TorpedoGun = function(player, ammo){
  this.id = shortId.generate();
  this.player = player;
  this.ammunition = ammo;
}

torpedoObjects.TorpedoGun.prototype.fire = function(directionVector){
  this.player.session.gameObjects.push(new torpedoObjects.Torpedo(this.player.public.position.clone(), this.player.private.velocity.clone().add(directionVector.clone().normalize().scale(config.torpedoSpeed)), directionVector));
}

torpedoObjects.Torpedo = function(pos, vel, heading){
  this.position = pos.add(vel);
  this.velocity = vel;
  this.heading = heading;
  this.timeLeft = config.torpedoTimer;
  this.type = "torpedo";
}

torpedoObjects.Torpedo.prototype.logic = function(session){
  // Movement
  this.position.add(this.velocity);
  this.velocity.scale(config.torpedoSpeedMultiplier);
  this.timeLeft--;
  if(this.timeLeft <= 0){
    session.gameObjects.splice(session.gameObjects.indexOf(this), 1);
    session.gameObjects.push(new Explosion(config.torpedoDamage, this.position, this.velocity));
  }
}

module.exports = torpedoObjects;

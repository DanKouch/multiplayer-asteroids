"use strict";

// Imports
const config = require("../../config.js");
const shortId = require('shortid');

let torpedoObjects = {};

torpedoObjects.TorpedoGun = function(player, ammo){
  this.id = shortId.generate();
  this.player = player;
  this.ammunition = ammo;
}

torpedoObjects.TorpedoGun.prototype.fire = function(directionVector){
  this.player.session.projectiles.torpedos.push(new torpedoObjects.Torpedo(this.player.public.position.clone(), this.player.private.velocity.clone().add(directionVector.clone().normalize().scale(config.torpedoSpeed)), directionVector));
}

torpedoObjects.Torpedo = function(pos, vel, heading){
  this.position = pos.add(vel);
  this.velocity = vel;
  this.heading = heading;
  this.timeLeft = config.torpedoTimer;
}

torpedoObjects.Torpedo.prototype.logic = function(session){
  // Movement
  this.position.add(this.velocity);
  this.velocity.scale(config.torpedoSpeedMultiplier);
  this.timeLeft--;
  if(this.timeLeft <= 0){
    session.projectiles.torpedos.splice(session.projectiles.torpedos.indexOf(this), 1);

    // Collision Detection
    session.players.forEach((player) => {
      if(Math.hypot((this.position.x - player.public.position.x), (this.position.y - player.public.position.y)) < config.torpedoExplosionRadius){
        player.removeHealth(config.torpedoDamage);
      }
    });
  }
}

module.exports = torpedoObjects;

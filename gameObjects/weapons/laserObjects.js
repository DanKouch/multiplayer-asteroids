"use strict";

// Imports
const config = require("../../config.js");
const shortId = require('shortid');

let laserObjects = {};

laserObjects.LaserGun = function(player, ammo){
  this.id = shortId.generate();
  this.player = player;
  this.ammunition = ammo;
}

laserObjects.LaserGun.prototype.fire = function(directionVector){
  this.player.session.projectiles.lasers.push(new laserObjects.Laser(this.player.public.position.clone(), directionVector.clone().normalize().scale(config.laserSpeed)));//this.player.private.velocity.clone().add(directionVector.clone().normalize()).normalize().scale(config.laserSpeed)));
}

laserObjects.Laser = function(pos, vel){
  this.position = pos.add(vel);
  this.velocity = vel;
  this.health = config.laserHealth;
}

laserObjects.Laser.prototype.logic = function(session){
  // Movement
  this.position.add(this.velocity);
  this.health--;
  if(this.health <= 0){
    session.projectiles.lasers.splice(session.projectiles.lasers.indexOf(this), 1);
  }

  // Collision Detection
  session.players.forEach((player) => {
    if(Math.hypot((this.position.x - player.public.position.x), (this.position.y - player.public.position.y)) < 15){
      player.removeHealth(config.laserDamage);
      session.projectiles.lasers.splice(session.projectiles.lasers.indexOf(this), 1);
    }
  });

}

module.exports = laserObjects;

"use strict";

// Imports
const config = require("../../config.js");
const shortId = require('shortid');

let mineObjects = {};

mineObjects.MineGun = function(player, ammo){
  this.id = shortId.generate();
  this.player = player;
  this.ammunition = ammo;
}

mineObjects.MineGun.prototype.fire = function(){
  this.player.session.projectiles.mines.push(new mineObjects.Mine(this.player.public.position.clone(), this.player.private.velocity.clone()));
}

mineObjects.Mine = function(pos, vel){
  this.position = pos.add(vel);
  this.velocity = vel;
  this.timeLeft = config.mineTimer;
}

mineObjects.Mine.prototype.logic = function(session){
  // Movement
  this.position.add(this.velocity);
  this.velocity.scale(1-(config.ambientFriction*config.mineFrictionMultiplier));
  this.timeLeft--;
  if(this.timeLeft <= 0){
    session.projectiles.mines.splice(session.projectiles.mines.indexOf(this), 1);

    // Collision Detection
    session.players.forEach((player) => {
      if(Math.hypot((this.position.x - player.public.position.x), (this.position.y - player.public.position.y)) < config.mineExplosionRadius){
        player.removeHealth(config.mineDamage);
      }
    });
  }
}

module.exports = mineObjects;

"use strict";

// Imports
const config = require("../../config.js");
const shortId = require('shortid');
const Explosion = require("./Explosion.js");

let mineObjects = {};

mineObjects.MineGun = function(player, ammo){
  this.id = shortId.generate();
  this.player = player;
  this.ammunition = ammo;
}

mineObjects.MineGun.prototype.fire = function(){
  this.player.session.gameObjects.push(new mineObjects.Mine(this.player.public.position.clone(), this.player.private.velocity.clone()));
}

mineObjects.Mine = function(pos, vel){
  this.position = pos.add(vel);
  this.velocity = vel;
  this.timeLeft = config.mineTimer;
  this.type = "mine";
}

mineObjects.Mine.prototype.logic = function(session){
  // Movement
  this.position.add(this.velocity);
  this.velocity.scale(1-(config.ambientFriction*config.mineFrictionMultiplier));
  this.timeLeft--;
  if(this.timeLeft <= 0){
    session.gameObjects.splice(session.gameObjects.indexOf(this), 1);
    session.gameObjects.push(new Explosion(config.mineDamage, this.position, this.velocity));
  }
}

module.exports = mineObjects;

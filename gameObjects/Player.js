"use strict";

// Imports
const config = require("../config.js");
const shortId = require('shortid');

let Player = function(socket, username){
  this.socket = socket;

  this.public = {
    username: username,
    directionIdentifier: 0,
    id: shortId.generate(),
    position: {
      x: 0,
      y: 0
    }
  };

  this.private = {
    health: 100,
    velocity: {
      x: 0,
      y: 0
    }
  };

  this.outOfBoundsTime = 0;

  this.keysPressed = [];
  this.mouseInfo = {
    pressed: false
  };

  let _this = this;

  this.socket.on('key press event', function(e){
    shortId.generate();

    if(e.pressed){
      if(_this.keysPressed.indexOf(e.key) === -1){
		  	_this.keysPressed.push(e.key);
		  }
    }else{
      if(_this.keysPressed.indexOf(e.key) !== -1){
		  	_this.keysPressed.splice(_this.keysPressed.indexOf(e.key), 1);
		  }
    }
  });

  this.socket.on('mouse press event', function(e){
    _this.mouseInfo.pressed = e.pressed;
  });

}

Player.prototype.logic = function(){
  /* Direction Identifiers:
  ** IDLE: 0
  ** UP: 4
  ** DOWN: 1
  ** LEFT: 2
  ** RIGHT: 3
  */

  let lastPressed = this.keysPressed.slice().reverse().find((key) => ["W", "A", "S", "D"].indexOf(key) !== -1);

  if(lastPressed === "W"){
    this.public.directionIdentifier = 4;
  }else if(lastPressed === "A"){
    this.public.directionIdentifier = 2;
  }else if(lastPressed === "S"){
    this.public.directionIdentifier = 1;
  }else if(lastPressed === "D"){
    this.public.directionIdentifier = 3;
  }else{
    this.public.directionIdentifier = 0;
  }

  if(this.keysPressed.indexOf("W") !== -1 && this.private.velocity.y >= (-1*config.maxSpeed)+config.jetpackPower){
    this.private.velocity.y-=config.jetpackPower;
  }
  if(this.keysPressed.indexOf("A") !== -1 && this.private.velocity.x >= (-1*config.maxSpeed)+config.jetpackPower){
    this.private.velocity.x-=config.jetpackPower;
  }
  if(this.keysPressed.indexOf("S") !== -1 && this.private.velocity.y <= config.maxSpeed-config.jetpackPower){
    this.private.velocity.y+=config.jetpackPower;
  }
  if(this.keysPressed.indexOf("D") !== -1 && this.private.velocity.x <= config.maxSpeed-config.jetpackPower){
    this.private.velocity.x+=config.jetpackPower;
  }

  if(this.private.velocity.x > 0){
    this.private.velocity.x -= config.ambientFriction;
  }else if(this.private.velocity.x < 0){
    this.private.velocity.x += config.ambientFriction;
  }

  if(this.private.velocity.y > 0){
    this.private.velocity.y -= config.ambientFriction;
  }else if(this.private.velocity.y < 0){
    this.private.velocity.y += config.ambientFriction;
  }

  if(Math.abs(this.private.velocity.x) <= config.ambientFriction && Math.abs(this.private.velocity.y) <= config.ambientFriction){
    this.private.velocity.x = 0;
    this.private.velocity.y = 0;
  }

  this.public.position.x += this.private.velocity.x;
  this.public.position.y += this.private.velocity.y;

  // Handle boundry logic
  if(Math.hypot(this.public.position.x, this.public.position.y) >= config.unsafeDistance){
    this.outOfBoundsTime++;
    if(this.outOfBoundsTime >= config.unsafeDistanceDamageTime){
        this.private.health -= (this.private.health >= 5) ? 5 : 0;
        this.outOfBoundsTime = 0;
    }
  }else{
    this.outOfBoundsTime = 0;
  }
}

module.exports = Player;

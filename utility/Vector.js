"use strict";

let Vector = function(x, y){
  this.x = x;
  this.y = y;
}

Vector.prototype.add = function(otherVector){
  this.x += otherVector.x;
  this.y += otherVector.y;
  return this;
}

Vector.prototype.subtract = function(otherVector){
  this.x -= otherVector.x;
  this.y -= otherVector.y;
  return this;
}

Vector.prototype.divide = function(otherVector){
  this.x /= otherVector.x;
  this.y /= otherVector.y;
  return this;
}

Vector.prototype.multiply = function(otherVector){
  this.x *= otherVector.x;
  this.y *= otherVector.y;
  return this;
}

Vector.prototype.scale = function(factor){
  this.x *= factor;
  this.y *= factor;
  return this;
}

Vector.prototype.clone = function(){
  return new Vector(this.x, this.y);
}

Vector.prototype.getMagnitude = function(){
  return Math.hypot(this.x, this.y);

}

Vector.prototype.addToMagnitude = function(value){
  this.add(this.clone().normalize().scale(value));
  return this;
}

Vector.prototype.subtractFromMagnitude = function(value){
  this.subtract(this.clone().normalize().scale(value));
  return this;
}

Vector.prototype.scaleMagnitude = function(value){
  this.multiply(this.clone().normalize().scale(value));
  return this;
}

Vector.prototype.normalize = function(){
  this.scale(1/this.getMagnitude());
  return this;
}

module.exports = Vector;

$(function(){

  // Set up view
  var canvas = document.getElementById("gameCanvas");
  var g = canvas.getContext("2d");

  document.body.style.overflow = "hidden";
	document.body.style.margin = "0px 0px 0px 0px";

  canvas.height = window.innerHeight;
  canvas.width =  window.innerWidth;

  window.onresize = function(){
    canvas.height = window.innerHeight;
    canvas.width =  window.innerWidth;
    gameTick();
  };

  var socket = io();

  var gameLoop = setInterval(gameTick, 10);

  function gameTick(){
    g.fillRect(0, 0, canvas.width, canvas.height);
  }
});

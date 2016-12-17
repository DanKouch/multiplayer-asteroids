"use strict";

// Load images
var images = {};
images.playerSpritesheet = new Image();
images.playerSpritesheet.src = "./images/PlayerSpritesheet.png"
images.selectorSpritesheet = new Image();
images.selectorSpritesheet.src = "./images/SelectorSpritesheet.png"
images.starsSpritesheet = new Image();
images.starsSpritesheet.src = "./images/StarsSpritesheet.png"

// Config
var config = {
  renderTick: 10,
  maxSafeDistance: 50000,
  minimapSize: 2,
  minimapPadding: 25,
  minimapAlpha: 0.75,
  colors: {
    background: "#000",
    centerBlock: "#505",
    text: "#fff",
    nameTextBackground: "#555",
    warning: "#f00",
    minimapBackground: "#666",
    minimapLines: "#303030",
    laserColor: "#f00"
  }
};

var colors = ["red", "orange", "yellow", "green", "blue", "purple"];

$(function(){

  // Retreive username from cookie
  $("#usernameInput").val(document.cookie.split("=")[1]);

  // Set up view
  var canvas = document.getElementById("gameCanvas");
  var g = canvas.getContext("2d");

  document.body.style.overflow = "hidden";
	document.body.style.margin = "0px 0px 0px 0px";

  window.onresize = function(){
    canvas.height = window.innerHeight;
    canvas.width =  window.innerWidth;
    render();
  }
  window.onresize();

  // Handle login
  var socket = io();
  $("#connectButton").on("click", function(){
    $("#connectButton").prop('disabled', true);

    socket.emit("login", {
      username: $("#usernameInput").val(),
      sessionId: $("#sessionIdInput").val()
    });

    socket.on('login response', function(response){
      if(response.successful){
        document.cookie = "username=" + $("#usernameInput").val();
        $("#loginDiv").fadeOut(300);
        $("#gameCanvas").fadeIn(300);
        manageConnection();
      }else{
        if(response.usernameError !== undefined){
          $("#usernameErrorText").html(response.usernameError);
          $("#usernameInput").addClass("error");
        }else{
          $("#usernameErrorText").html("&nbsp;");
          $("#usernameInput").removeClass("error");
        }
        if(response.sessionIdError !== undefined){
          $("#sessionIdErrorText").html(response.sessionIdError);
          $("#sessionIdInput").addClass("error");
        }else{
          $("#sessionIdErrorText").html("&nbsp;");
          $("#sessionIdInput").removeClass("error");
        }
        $("#connectButton").prop('disabled', false);
      }
    });
  });

  var currentServerPacket = undefined;

  // Handle all server connections after login is complete
  function manageConnection(){
    socket.on('server packet', function(serverPacket){
      currentServerPacket = serverPacket;
    });

    // Render loop
    var renderLoop = setInterval(render, config.renderTick);

    // Handle user input and send to server
    var keysPressed = [];

  	document.addEventListener("keydown", function(e){
  	   if(keysPressed.indexOf(String.fromCharCode(e.keyCode)) === -1){
  	  	keysPressed.push(String.fromCharCode(e.keyCode));

  	    socket.emit("key press event", {
          key: String.fromCharCode(e.keyCode),
          pressed: true
        })

  	  }
  	})

  	document.addEventListener("keyup", function(e){
  	  if(keysPressed.indexOf(String.fromCharCode(e.keyCode)) !== -1){
  	  	keysPressed.splice(keysPressed.indexOf(String.fromCharCode(e.keyCode)), 1);
        socket.emit("key press event", {
          key: String.fromCharCode(e.keyCode),
          pressed: false
        });
  	  }
  	});

    window.addEventListener("blur", function(e){
        for(var i = 0; i < keysPressed.length; i++){
          socket.emit("key press event", {
            key: keysPressed[i],
            pressed: false
          });
        }
  	});

  	document.addEventListener("mousedown", function(e){
      socket.emit("mouse press event", {
        pressed: true,
        relativeX: e.clientX - canvas.width/2,
        relativeY: e.clientY - canvas.height/2,
        weaponType: 0
      });
  	});

  	document.addEventListener("mouseup", function(e){
      socket.emit("mouse press event", {
        pressed: false
      });
  	});
  }

  function render(){
    if(currentServerPacket === undefined){
      g.fillStyle = config.colors.background;
      g.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    g.mozImageSmoothingEnabled = false;
    g.webkitImageSmoothingEnabled = false;
    g.msImageSmoothingEnabled = false;
    g.imageSmoothingEnabled = false;

    var scale = canvas.height/15;

    g.fillStyle = config.colors.background;
    g.fillRect(0, 0, canvas.width, canvas.height);

    var center = {
      x: currentServerPacket.you.public.position.x - canvas.width/2,
      y: currentServerPacket.you.public.position.y - canvas.height/2
    }

    // Draw stars
    for(var x = (0-(center.x/4)%(scale*6))-scale*6; x < canvas.width; x += scale*6){
      for(var y = (0-(center.y/4)%(scale*6))-scale*6; y < canvas.height; y+= scale*6){
        g.drawImage(images.starsSpritesheet, 0, 0, 100, 100, x, y, scale*6, scale*6);
      }
    }

    for(var x = (0-(center.x/6)%(scale*4))-scale*6; x < canvas.width; x += scale*4){
      for(var y = (0-(center.y/6)%(scale*4))-scale*6; y < canvas.height; y+= scale*4){
        g.drawImage(images.starsSpritesheet, 0, 100, 100, 100, x, y, scale*4, scale*4);
      }
    }

    for(var x = (0-(center.x/8)%(scale*6))-scale*6; x < canvas.width; x += scale*2){
      for(var y = (0-(center.y/8)%(scale*6))-scale*6; y < canvas.height; y+= scale*2){
        g.drawImage(images.starsSpritesheet, 0, 200, 100, 100, x, y, scale*2, scale*2);
      }
    }

    // Center reference
    g.fillStyle = config.colors.centerBlock;
    g.fillRect((0-scale/8)-center.x, (0-scale/8)-center.y, (scale/4), (scale/4));

    // Border circle
    g.lineWidth = 20;
    g.strokeStyle = config.colors.warning;
    g.beginPath();
    g.arc(0-center.x, 0-center.y, config.maxSafeDistance, 0, 2 * Math.PI, false);
    g.stroke();

    // Draw Lasers
    g.strokeStyle = config.colors.laserColor;
    g.lineWidth = scale/10;
    currentServerPacket.projectiles.lasers.forEach((laser) => {
      g.arc(laser.position.x-center.x, laser.position.y-center.y, scale/10, 0, 2 * Math.PI, false);
      g.globalAlpha = laser.health < 50 ? laser.health/50 : 1;
      g.beginPath();
      g.moveTo(laser.position.x-center.x, laser.position.y-center.y);
      g.lineTo(laser.position.x-center.x+(laser.velocity.x*scale/20), laser.position.y-center.y+(laser.velocity.y*scale/20));
      g.stroke();
      g.globalAlpha = 1;
    });

    // Draw the current user's player
    g.drawImage(images.playerSpritesheet, 0, currentServerPacket.you.public.directionIdentifier*40, 40, 40, (currentServerPacket.you.public.position.x-scale/2)-center.x, (currentServerPacket.you.public.position.y-scale/2)-center.y, scale, scale);
    g.drawImage(images.selectorSpritesheet, 0, currentServerPacket.you.public.colorIdentifier*40, 40, 40, (currentServerPacket.you.public.position.x-scale/2)-center.x, (currentServerPacket.you.public.position.y-scale/2)-center.y, scale, scale);

    // Draw the rest of the players
    let fontSize = Math.floor(scale/6);
    g.font = fontSize + "px PressStart2P";

    currentServerPacket.players.forEach((player) => {
      let x = (player.position.x-scale/2)-center.x;
      let y = (player.position.y-scale/2)-center.y;
      g.drawImage(images.playerSpritesheet, 0, player.directionIdentifier*40, 40, 40, x, y, scale, scale);
      g.drawImage(images.selectorSpritesheet, 0, player.colorIdentifier*40, 40, 40, x, y, scale, scale);

      g.fillStyle = config.colors.nameTextBackground;
      g.globalAlpha = 0.5;
      g.fillRect(x, y - fontSize*2 + 3, g.measureText(player.username).width + 7, fontSize + 4);

      g.fillStyle = config.colors.text;
      g.fillText(player.username, x + 5, y - scale/10);
      g.globalAlpha = 1;
    });

    // GUI Text
    g.fillStyle = config.colors.text;
    g.font = "56px PressStart2P";
    g.fillText(currentServerPacket.you.public.username, 10, canvas.height - 60);

    g.font = "32px PressStart2P";
    g.fillText("Health: " + currentServerPacket.you.private.health + "/100", 10, canvas.height - 20);

    g.font = "12px PressStart2P";
    g.fillText("Session ID: " + currentServerPacket.sessionID, canvas.width - 270, canvas.height - 10);

    // Minimap
    g.save();
    g.fillStyle = config.colors.minimapBackground;
    g.globalAlpha = config.minimapAlpha;

    let minimap = {
      x: canvas.width - (config.minimapSize*scale) - config.minimapPadding,
      y: (config.minimapSize*scale) + config.minimapPadding,
      scale: config.maxSafeDistance / (config.minimapSize*scale)
    }
    g.beginPath();
    g.arc(minimap.x, minimap.y, (config.minimapSize*scale), 0, 2 * Math.PI, false);
    g.fill();
    g.clip();
    g.closePath();

    g.strokeStyle = config.colors.minimapLines;
    g.lineWidth = 1;

    // Draw minimap lines
    g.beginPath();
    g.moveTo(minimap.x, minimap.y + (config.minimapSize*scale));
    g.lineTo(minimap.x, minimap.y - (config.minimapSize*scale));
    g.stroke();
    g.beginPath();
    g.moveTo(minimap.x + (config.minimapSize*scale), minimap.y);
    g.lineTo(minimap.x - (config.minimapSize*scale), minimap.y);
    g.stroke();
    g.beginPath();
    g.arc(minimap.x, minimap.y, (config.minimapSize*scale)*(1/3), 0, 2 * Math.PI, false);
    g.stroke();
    g.beginPath();
    g.arc(minimap.x, minimap.y, (config.minimapSize*scale)*(2/3), 0, 2 * Math.PI, false);
    g.stroke();
    g.beginPath();
    g.arc(minimap.x, minimap.y, (config.minimapSize*scale), 0, 2 * Math.PI, false);
    g.stroke();

    // Draw player dots on minimap
    if(Math.floor(Date.now()/400)%2==0){
      currentServerPacket.players.concat(currentServerPacket.you.public).forEach((player) => {
        g.fillStyle = colors[player.colorIdentifier];
        g.beginPath();
        g.arc(minimap.x+(player.position.x/minimap.scale), minimap.y + (player.position.y/minimap.scale), scale/20, 0, 2 * Math.PI, false);
        g.fill();
        g.closePath();
      });
    }

    g.restore();

    // Distance Warning
    if(Math.hypot(currentServerPacket.you.public.position.x, currentServerPacket.you.public.position.y) >= 50000){
      g.fillStyle = Math.floor(Date.now()/200)%2==0 ? config.colors.warning : config.colors.text;

      let warningTextLineOne = "!!!WARNING!!!";
      g.font = "72px PressStart2P";
      g.fillText(warningTextLineOne, canvas.width/2 - g.measureText(warningTextLineOne).width/2, canvas.height/2 - 100);

      g.fillStyle = config.colors.warning;

      let warningTextLineTwo = "TURN BACK NOW";
      g.font = "42px PressStart2P";
      g.fillText(warningTextLineTwo, canvas.width/2 - g.measureText(warningTextLineTwo).width/2, canvas.height/2 + 150);
    }

    if(!socket.connected){
      g.fillStyle = config.colors.warning;
      g.font = "16px PressStart2P";
      g.fillText("Lost connection with server", canvas.width - 450, 30);
    }
  }
});

"use strict";

// Load images
var images = {};
images.playerSpritesheet = new Image();
images.playerSpritesheet.src = "./images/PlayerSpritesheet.png"
images.selectorSpritesheet = new Image();
images.selectorSpritesheet.src = "./images/SelectorSpritesheet.png"
images.starsSpritesheet = new Image();
images.starsSpritesheet.src = "./images/StarsSpritesheet.png"

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
    var renderLoop = setInterval(render, 10);

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
        pressed: true
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
      g.fillStyle = "#000";
      g.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    g.mozImageSmoothingEnabled = false;
    g.webkitImageSmoothingEnabled = false;
    g.msImageSmoothingEnabled = false;
    g.imageSmoothingEnabled = false;

    var scale = canvas.height/15;

    g.fillStyle = "#000";
    g.fillRect(0, 0, canvas.width, canvas.height);

    var center = {
      x: currentServerPacket.you.publicPlayerInfo.position.x - canvas.width/2,
      y: currentServerPacket.you.publicPlayerInfo.position.y - canvas.height/2
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
    g.fillStyle = "purple";
    g.fillRect((0-scale/8)-center.x, (0-scale/8)-center.y, (scale/4), (scale/4));

    // Draw the current user's player
    g.drawImage(images.playerSpritesheet, 0, currentServerPacket.you.publicPlayerInfo.directionIdentifier*40, 40, 40, (currentServerPacket.you.publicPlayerInfo.position.x-scale/2)-center.x, (currentServerPacket.you.publicPlayerInfo.position.y-scale/2)-center.y, scale, scale);
    g.drawImage(images.selectorSpritesheet, 0, currentServerPacket.you.publicPlayerInfo.colorIdentifier*40, 40, 40, (currentServerPacket.you.publicPlayerInfo.position.x-scale/2)-center.x, (currentServerPacket.you.publicPlayerInfo.position.y-scale/2)-center.y, scale, scale);

    // Draw the rest of the players
    let fontSize = Math.floor(scale/6);
    g.font = fontSize + "px PressStart2P";

    currentServerPacket.players.forEach((player) => {
      let x = (player.position.x-scale/2)-center.x;
      let y = (player.position.y-scale/2)-center.y;
      g.drawImage(images.playerSpritesheet, 0, player.directionIdentifier*40, 40, 40, x, y, scale, scale);
      g.drawImage(images.selectorSpritesheet, 0, player.colorIdentifier*40, 40, 40, x, y, scale, scale);

      g.fillStyle = "#555";
      g.globalAlpha = 0.5;
      g.fillRect(x, y - fontSize*2 + 3, g.measureText(player.username).width + 7, fontSize + 4);

      g.fillStyle = "#fff";
      g.fillText(player.username, x + 5, y - scale/10);
      g.globalAlpha = 1;
    });

    // Draw GUI
    g.fillStyle = "#fff";
    g.font = "56px PressStart2P";
    g.fillText(currentServerPacket.you.publicPlayerInfo.username, 10, canvas.height - 60);

    g.font = "32px PressStart2P";
    g.fillText("Health: " + currentServerPacket.you.privatePlayerInfo.health + "/100", 10, canvas.height - 20);

    g.font = "12px PressStart2P";
    g.fillText("Session ID: " + currentServerPacket.sessionID, canvas.width - 270, canvas.height - 10);

    if(!socket.connected){
      g.fillStyle = "#f00";
      g.font = "16px PressStart2P";
      g.fillText("Lost connection with server", canvas.width - 450, 30);
    }
  }
});

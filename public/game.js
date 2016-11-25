"use strict";

$(function(){
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
        $("#loginDiv").fadeOut(300);
        $("#gameCanvas").fadeIn(300);
        manageConnection();
      }else{
        $("#usernameErrorText").text(response.usernameError);
        $("#sessionIdErrorText").text(response.sessionIdError);
        $("#connectButton").prop('disabled', false);
      }
    });
  });

  var currentServerPacket = undefined;

  // Handle all server connections after login is complete
  function manageConnection(){
    var packetCount = 0;
    socket.on('server packet', function(serverPacket){
      // Don't log every received packet: too much information
      packetCount++;
      if(packetCount > 15){
        console.log(serverPacket);
        packetCount = 0;
      }
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
  	  	keysPressed.splice(keysPressed.indexOf(String.fromCharCode(e.keyCode)));
        socket.emit("key press event", {
          key: String.fromCharCode(e.keyCode),
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

    let scale = canvas.height/50;

    g.fillStyle = "#000";
    g.fillRect(0, 0, canvas.width, canvas.height);

    g.fillStyle = currentServerPacket.you.publicPlayerInfo.color;
    g.fillRect(currentServerPacket.you.publicPlayerInfo.position.x-scale/2, currentServerPacket.you.publicPlayerInfo.position.y-scale/2, scale, scale);

    currentServerPacket.players.forEach((player) => {
      g.fillStyle = player.color;
      g.fillRect(player.position.x-scale/2, player.position.y-scale/2, scale, scale);
    });

    // Draw GUI
    g.fillStyle = "#fff";
    g.font = "72px Helvetica";
    g.fillText(currentServerPacket.you.publicPlayerInfo.username, 10, canvas.height - 70);

    g.font = "42px Helvetica";
    g.fillText("Health: " + currentServerPacket.you.privatePlayerInfo.health + "/100", 10, canvas.height - 20);

    g.font = "14px Helvetica";
    g.fillText("Session ID: " + currentServerPacket.sessionID, canvas.width - 170, canvas.height - 10);

    if(!socket.connected){
      g.fillStyle = "#f00";
      g.font = "24px Helvetica";
      g.fillText("Lost connection with server", canvas.width - 300, 30);
    }
  }
});

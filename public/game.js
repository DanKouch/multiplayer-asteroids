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
  $("#connectButton").on("click", function(){
    $("#connectButton").prop('disabled', true);
    var socket = io();

    socket.emit("login", {
      username: $("#usernameInput").val(),
      sessionId: $("#sessionIdInput").val()
    });

    socket.on('login response', function(response){
      if(response.successful){
        $("#loginDiv").fadeOut(300);
        manageConnection(socket);
      }else{
        $("#usernameErrorText").text(response.usernameError);
        $("#sessionIdErrorText").text(response.sessionIdError);
        $("#connectButton").prop('disabled', false);
      }
    });
  });

  // Handle all server connections after login is complete
  function manageConnection(socket){
    var packetCount = 0;
    socket.on('server packet', function(publicPacket){
      // Don't log every received packet: too much information
      packetCount++;
      if(packetCount > 15){
        console.log(publicPacket);
        packetCount = 0;
      }
    });

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

    // Handle overall game tick
    var gameLoop = setInterval(function(){
      // Any needed logic can go here
      render();
    }, 10);
  }

  function render(){
    g.fillRect(0, 0, canvas.width, canvas.height);
  }
});

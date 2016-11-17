// Config
const COLORS = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple"]
const MAX_PLAYERS_PER_SESSION = 8;

// Imports
var express = require('express')
var shortId = require('shortid')
var escape = require('escape-html')
var profanityCensor = require('profanity-censor')
var app = express()

// Webserver Connections
app.set('port', process.env.PORT || 3000)

var server = app.listen(app.get('port'), function () {
  console.log('HTTP server running on port ' + app.get('port'))
})

var io = require('socket.io').listen(server)

app.use(express.static('public'))

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html')
})

// Websocket Connections
io.on('connection', function(socket){
  socket.on('username', function(unsafeUsername){
    var safeUsername = profanityCensor.filter(escape(unsafeUsername))
    if(usernameOk(safeUsername)){
      socket.playerInfo = {username:safeUsername}
      getSessionToJoin(socket).addClient(socket)
      socket.on('disconnect', function(){
        console.log("Client '" + safeUsername + "' disconnected")
      })
    }else{
      socket.emit("err", "Bad username")
    }
  })
})

function usernameOk(username){
  return (username.trim() !== "" && username !== "null")
}

function getSessionToJoin(socket){
  for(var i = 0; i < sessions.length; i++){
    if(sessions[i].clients.length < MAX_PLAYERS_PER_SESSION){
      return sessions[i]
    }
  }
  return sessions[sessions.push(new session)-1]
}

// Set up sessions
function session(){
  this.id = shortId.generate()
  this.clients = []
  this.tick = setInterval(this.sendPackets.bind(this), 10)

  console.log("New session created with id " + this.id)
}

session.prototype.addClient = function(socket){
  var index = this.clients.push(socket)
  socket.playerInfo.color = COLORS[index-1]
  socket.playerInfo.id = shortId.generate()

  console.log("User " + socket.playerInfo.username + " (" + socket.playerInfo.id + ") connected to session " + this.id)



  // Gather client controls
  var sessionID = this.id

  socket.on('key press event', function(e){
    shortId.generate()
    console.log("User " + socket.playerInfo.username + " (" + socket.playerInfo.id + ") on session " + sessionID + " has " + (e.pressed ? "pressed" : "released") + " key " + e.key)
  })

  socket.on('mouse press event', function(e){
    console.log("User " + socket.playerInfo.username + " (" + socket.playerInfo.id + ") on session " + sessionID + " has " + (e.pressed ? "pressed" : "released") + " their mouse")
  })
}

// Session object declaration
session.prototype.sendPackets = function(){
  for(var i = 0; i < this.clients.length; i++){

    var personalPlayerPacket = []
    for(var x = 0; x < this.clients.length; x++){
      if(this.clients[i].playerInfo.id !== this.clients[x].playerInfo.id){
        personalPlayerPacket.push({
          username: this.clients[x].playerInfo.username,
          color: this.clients[x].playerInfo.color,
          id: this.clients[x].playerInfo.id,
          x: 0,
          y: 0
        })
      }
    }

    this.clients[i].emit("server packet", {
        players: personalPlayerPacket,
        sessionID: this.id,
        you: {
          username: this.clients[i].playerInfo.username,
          color: this.clients[i].playerInfo.color,
          id: this.clients[i].playerInfo.id,
          x: 0,
          y: 0,
          health: 0
        }
    })
  }
}


var sessions = [new session()]

var io;
var gameSocket;
var alphabet = [' ','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p',
'q','r','s','t','u','v','w','x','y','z'];

var started = false;

var games = {};
var players = {};
var numPlayers = 0;

var pointsPerSecond = 1;


//Initializing game
exports.initGame = function(sio, socket){
  io = sio;
  gameSocket = socket;
  gameSocket.emit('connected', {message: "You are connected!", id:this.id});
  addPlayer(gameSocket);
  //Host Events
  gameSocket.on('createGame', createGame);
  gameSocket.on('setGameEncryption', setGameEncryption);
  gameSocket.on('updateEncryption', updateEncryption);
  //client events
  gameSocket.on('gameList', sendGameList)
  gameSocket.on('joinGame', joinGame);
  gameSocket.on('answer', playerAnswer);
  gameSocket.on('disconnected', removePlayer)
  gameSocket.on('changeName', changeName);

  if(!started){
    started = true;
    setInterval(update, 5000);
  }
}

function addPlayer(s){
  numPlayers++;
  players[s.id]={
    socket:s,
    points:0,
    game_points:0,
    name:"player" + numPlayers,
    games:[],
    num_won:0
  }

}

function removePlayer(){
  delete players[this.id];
  //numPlayers--;
}

function update(){
  Object.keys(games).forEach(function(gameId){
    var game = games[gameId];
    if(!game.solved){
      var deltaTime = (Date.now()-game.last_update)/1000;
      game.points += pointsPerSecond * deltaTime;
      players[game.hostId].game_points = game.points/2;
      game.last_update = Date.now();
    }
  });
  broadcastPlayerList();
  broadcastGameList();
}

function createGame(data){
  var thisGameId = (Math.random() * 100000) | 0;
  var w = getRandomWords(thisGameId);

  games[thisGameId] = {
    hostId:this.id,
      host:this,
       decyrpted: w,
       solved:false,
       player_count:0,
       points: 0,
       last_update: Date.now()
  };
  players[this.id].games.push(thisGameId);

  this.join(thisGameId.toString());
  this.emit('gameCreated', {gameId:thisGameId, words:w, id:this.id});

}

//bad encryption
function cancelGame(data){
  var gameId = data.gameId;
  var id = data.id;
  if(id == games[gameId].host){

  games[gameId].host.leave(gameId.toString());
  var index = players[id].games.indexOf(gameId);
  if(index)
    players[id].games.splice(index,1);
  delete games[gameId];
  }

}

function setGameEncryption(data){
  if(games[data.gameId].hostId == data.id){
    var valid = validateGame(data.gameId);
    if(valid){
    games[data.gameId].encrypted = data.encrypted;
    broadcastGameList();
    broadcastPlayerList();
    this.emit('finishedSetup');

  }else{
    this.emit('badEncryption')
  }
  }


}

function validateGame(id){
  var index = games[id].decyrpted.indexOf('@');
  if(index != -1){
    return false;
  }else
  return true;
}

function updateEncryption(data){
  if(games[data.gameId].hostId == data.id){
    games[data.gameId].encrypted = data.encrypted;
    //updateEncryption lowers player score by 20%
    games[data.gameId].points = 0.8*games[data.gameId].points;
    io.to(String(data.gameId)).emit('updatedEncryption', {
      gameId:data.gameId,
      words:games[data.gameId].encrypted
    });
  }

}

function joinGame(data){
  var gameId = data.gameId;
  if(games[gameId]){
    if(games[gameId].hostId == this.id){

      this.emit('joinedGame', {joined:false, message:"Can't Join Game you own"})
    }
    else if(!games[gameId].solved){

      if(this.gameId){
        this.leave(String(this.gameId));
        games[this.gameId].player_count--;
      }

      this.gameId = gameId;
      this.join(gameId.toString());
      this.gameId = gameId;
      games[this.gameId].player_count++;
      this.emit('joinedGame', {joined:true, id:this.id, game:gameId,words:games[gameId].encrypted});
    }
    else{
      this.emit('joinedGame', {joined:false, message:"This game is already over"});
    }
  }else{
    this.emit('joinedGame', {joined:false, message:"Game does not exist. Player may not have one"})
  }
}

function getGameInfo(){
  //sorts games in ascending order
  var gameIds = Object.keys(games).filter(function(id){
    return (!(games[id].solved));
  }).sort(function(a,b){
    return games[b].points - games[a].points;
  });
  var owners = [];
  var points = gameIds.map(function(id){
    owners.push(players[games[id].hostId].name);
    return games[id].points;
  });

  return {
    games:gameIds.join(','),
    owners:owners.join(','),
    points:points.join(',')
  }
}

function getPlayerInfo(){
  var playerIds = Object.keys(players).sort(function(a,b){
    return (players[b].points+players[b].game_points) - (players[a].points+players[a].game_points);
  });
  var names = [];
  var games_won = [];
  var current_game = [];

  var points = playerIds.map(function(id){
    names.push(players[id].name);
    games_won.push(players[id].num_won);
    current_game.push(""+players[id].games[players[id].games.length-1]);

    return players[id].points;
  });
  return{
    players:playerIds.join(','),
    names:names.join(','),
    points:points.join(','),
    games_won:games_won.join(','),
    current_game:current_game.join(',')
  }
}

function broadcastPlayerList(){
  io.sockets.emit('playerList', getPlayerInfo());
}

function broadcastGameList(){
  io.sockets.emit('gameList',getGameInfo());

}
function sendGameList(){

  this.emit('gameList',getGameInfo());
}

function getRandomWords(id){
  var words = wordPool[id%wordPool.length];
  return words.toLowerCase().replace(/[^a-z \s]/gi, "");


  //console.log(words);

}

function wordsToNum(words){
  var w = words.split('').map(function(char){
    return alphabet.indexOf(char);
  });
  //console.log(w);
  return w;
}


function numToWords(words){
  var w = words.map(function(char){
    return alphabet[parseInt(char)];
  });
  w = w.join('');
  //console.log(w);
  return w;
}



//Two players have joined. Alert host
function playerAnswer(data){
  if(games[data.gameId].hostId != this.id){
    var answer = (games[data.gameId].decyrpted === data.guess)
      this.emit('checkedAnswer', {solved:answer, guess:data.guess});
      if(answer){
        games[data.gameId].solved = true;
        broadcastGameList();
        gameOver(data.gameId, data.guess, this.id);
      }
  }
}

function gameOver(gameId, guess, solver){
  game = games[gameId];
  player[solver].points += game.points;
  player[solver].num_won++;
  player[game.hostId].points += player[game.hostId].game_points;
  io.sockets.emit('gameOver', {
    gameId:gameId,
    guess:guess
  });
}

function changeName(data){
  players[this.id].name = data.name;
  broadcastPlayerList();
}




var wordPool = [
    "“’Why did you do all this for me?’ he asked. ‘I don’t deserve it. I’ve never done anything for you.’ ‘You have been my friend,’ replied Charlotte. ‘That in itself is a tremendous thing.’” E.B. White, Charlotte’s Web",
    "“When a child first catches adults out—when it first walks into his grave little head that adults do not always have divine intelligence, that their judgments are not always wise, their thinking true, their sentences just—his world falls into panic desolation. The gods are fallen and all safety gone. And there is one sure thing about the fall of gods: they do not fall a little; they crash and shatter or sink deeply into green muck. It is a tedious job to build them up again; they never quite shine. And the child’s world is never quite whole again. It is an aching kind of growing.” – John Steinbeck, East of Eden"
];

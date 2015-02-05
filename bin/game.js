var io;
var gameSocket;
var alphabet = [' ','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p',
'q','r','s','t','u','v','w','x','y','z'];


var games = {};
//Initializing game
exports.initGame = function(sio, socket){
  io = sio;
  gameSocket = socket;
  gameSocket.emit('connected', {message: "You are connected!"});

  //Host Events
  gameSocket.on('createGame', createGame);
  gameSocket.on('setGameEncryption', setGameEncryption)

  gameSocket.on('answer', playerAnswer);


}

function createGame(data){
  var thisGameId = (Math.random() * 100000) | 0;
  var w = getRandomWords(thisGameId);

  games[thisGameId] = {
    hostId:this.id,
       decyrpted: w,
       solved:false
  };
  this.join(thisGameId.toString());
  this.emit('gameCreated', {gameId:thisGameId, words:w, id:this.id});

}

function setGameEncryption(data){
  if(games[data.gameId] == data.id){
    games[data.gameId].encrypted = data.encrypted;
  }
  this.emit('finishedSetup');
}

function getRandomWords(id){
  return words = wordPool[id%wordPool.length];
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
    console.log(games[data.gameId].decyrpted, data.words);
      this.emit('checkedAnswer', {solved:(games[data.gameId].decyrpted === data.guess)});
}


var wordPool = [
    "my name is david",
    "my name is john"
];

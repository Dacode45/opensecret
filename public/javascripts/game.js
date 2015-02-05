'uss strict';

var IO = {
  int:function(){
    IO.socket = io.connect();
    IO.bindEvents();
  },

  bindEvents:function(){
    IO.socket.on('connected', IO.onConnected);
    IO.socket.on('newGameCreated', IO.onNewGameCreated);
    IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom);
    IO.socket.on('beginNewGame', IO.beginNewGame);
    IO.socket.on('newWordData', IO.onNewWordData);

    
    IO.socket.on('gameOver', IO.gameOver);
    IO.socket.on('error', IO.error);
    I
  },
  onConnected:function(){
    alert("connected");
  },
  onNewGameCreated:function(data){
    App.newGame(data.gameId, data.mySocketId,data.words);
  },
  playerJoinedRoom:function(data){
    App.updateWaitingScreen(data);
  },
  beginNewGame:function(data){
    App.beginNewGame(data);
  },
  onNewWordData:function(data){
    App.newWord(data);
  },
  hostCheckAnswer:function(data){
    if(App.myRole == 'Host'){
      App.Host.checkAnswer(data);
    }
  },
  gameOver:function(data){
    App[App.myRole].endGame(data);
  },
  error:function(data){
    alert(data.message);
  }


}

var App = {
  myId,
  games:{},
  currentGame,
  myGame,

  newGame:function(gameId, socketId, words){
    this.myId = socketId;
    games[gameId] = {decrypted: words};
    //guess
    var g = makeGuess(words);
    games[gameId].encrypted = g;
    myGame = gameId;
    IO.socket.emit('hostPrepareGame');

  },
  beginNewGame:function(data){
    if(data.gameId == myGame){

    }else{
      setUpView();
      currentGame = data.gameId;
    }
  },
  newWord:function(data){
    setWords(data.words);
  }
}

function encrypt(words){
  return words;
}

function setUpView(){
  $("textarea")[0].text("");
}

function setWords(words){
  $("textarea")[0].text(words);
}

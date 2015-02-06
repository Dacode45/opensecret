var mygame= {},current_game={};
var alphabet = [' ','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p',
'q','r','s','t','u','v','w','x','y','z'];
var socket;
var encryptionMethod;
var encrypter, decrypter;
var encryptionSyntaxFlag = false, decryptionSyntaxFlag=false;
function init(){

  encrypter = ace.edit("encrypter");
  encrypter.setTheme("ace/theme/twilight");
  encrypter.getSession().setMode("ace/mode/javascript");
  encrypter.resize()
  decrypter = ace.edit("solver");
  decrypter.setTheme("ace/theme/twilight");
  decrypter.getSession().setMode("ace/mode/javascript");
  decrypter.resize()

  encrypter.getSession().setValue("function solver(char, index, wordArray){ \nchar = char+5;\n while(char >= alphabet.length){\nchar -= alphabet.length;\n}\nreturn char;\n}");

  socket = io('http://localhost:3000');
  socket.on('gameCreated', createGame);
  socket.on('finishedSetup', setUpMyViews);
  socket.on('checkedAnswer', checkAnswer)
  socket.on('gameList', updateGameList);
  socket.on('playerList', updatePlayerList);
  socket.on('joinedGame', joinGame);
  socket.on('gameOver', gameOver);
  socket.on('badEncryption', badEncryption);

  getGameList();
}

function startGame(){

  if(!mygame.started || mygame.solved){
    //initViews();
    parseEncrptionMethod();
    if(!encryptionSyntaxFlag)
    socket.emit('createGame');
  }else{
    updateEncryption();
  }

}

function initViews(){

}

function parseEncrptionMethod(){
  var annotations = encrypter.getSession().getAnnotations();
//  console.log(annotations)
  if(annotations.length == 0){
    encryptionSyntaxFlag = false;
    var en = encrypter.getSession().getValue();
    var bye;
    encrypter = "bye = " + en; //have no idea why this works, but it enables eval to actually be a function so I'll take it.
    encryptionMethod = answerWrapper(encrypter);

  }else{
    encryptionSyntaxFlag = true;
    badCode();
  }

}
function badCode(){
  alert("You've got syntax errors. fix before submitting;");
}

function createGame(data){

  var thisGameId = data.gameId;
  //console.log(data);
  var words = String(data.words) //getRandomWords(thisGameId);
  console.log(words);
  var guess = encryptWords(wordsToNum(words), encryptionMethod);
  //console.log(guess);
  if(guess){
    socket.id = data.id;
    mygame = {started:true, id:thisGameId, decrypted:words, encrypted:guess};
    socket.emit('setGameEncryption', {id:socket.id, gameId:thisGameId, encrypted:guess});
    //console.log(socket);

    //  alert('gameReady');
  }else{
    socket.emit('cancelGame', {gameId:thisGameId, id:data.id});
  }

}

function badEncryption(){
  alert('Your encryption was bad or unsolvable, canceling game');
  socket.emit('cancelGame', {gameId:mygame.id, id:socket.id});
}

function updateEncryption(){
  parseEncryptionMethod();
  var guess = encryptWords(wordsToNum(mygame.decrypted), encryptionMethod);
  if(guess){

    socket.emit('updateEncryption', {id:socket.id, gameId:mygame.id, encrypted:guess});
  }
}

function updatedEncryption(data){
  if(data.gameId == mygame.id){
    mygame.encrypted = data.words
  }else{
    currentgame.encrypted = data.words;
    alert("host updated encryption");
  }
}

function joinGame(data){
  if(data.joined){
    var thisGameId = data.game;
    socket.id = data.id;
    current_game = {
      id:thisGameId,
      encrypted:data.words
    }
    console.log(data.words)
    setUpTheirViews();
  }else{
    alert(data.message);
  }

}


function setUpMyViews(data){
  $('#mycipher').text(numToWords(mygame.encrypted));
  changeStartButtonText("update");

}
function changeStartButtonText(text){
  $("#updateEncryptionButton").prop('value', text);
}

function setUpTheirViews(){
  $('#theircipher').text(numToWords(current_game.encrypted));
  decrypter.setValue("function solver(char, index, wordArray){ return char;}");

}

function updateGameList(data){
  //console.log(data);
  if(data.games){
    var gameList = data.games.split(',');
    var owners = data.owners.split(',');
    var points = data.points.split(',');

    $("#gameList").html("<ol id='list1'></ol>");
    gameList.forEach(function(id, index){
      $('#list1').append("<li>"+
      "<p> "+ owners[index] + ": " + points[index] + "</p>"+
      "<button class='btn btn-danger btn-sm'type='button' onclick='join("+id+");''>Break His Encryption</button>"
      +"</li>")
    });
  }

}

function updatePlayerList(data){
  //console.log(data);
  if(data.players){
    var ids = data.players.split(',');
    var names = data.names.split(',');
    var points = data.points.split(',');
    var games_won = data.games_won.split(',');
    var current_game = data.current_game.split(',');

    $("#playerList").html("<ol id='list2'></ol>");
    ids.forEach(function(id, index){

      if(id==socket.id){
        $('#playerName').text(names[index]);
      }

      $('#list2').append("<li>"+
      "<p> "+ names[index] + " points: " + points[index] + " won: "+games_won[index]+"</p>"+
      "<button class='btn btn-danger btn-sm' type='button' onclick='join("+current_game[index]+");''>Break His Encryption</button>"
      +"</li>")
    });
  }

}


function getGameList(){
  socket.emit('gameList');
}

function join(gameId){
  socket.emit("joinGame", {gameId:gameId});
}

function gameOver(data){
  if(mygame.id == data.gameId){
    mygame.solved = true;
    changeStartButtonText("Create Game");
    alert('Your game was solved');
  }else if(current_game.id == data.gameId){
    current_game.solved = true;
    showAnswer(data.guess);
    alert("Game Has been solved, join a new game");
  }
}

function changeName(){
  var newName = prompt("Enter a new name.");
  socket.emit("changeName",{ name:newName});
}

function showAnswer(answer){
  $('#theircipher').text(answer);
}

function answer(){
  var annotations = encrypter.getSession().getAnnotations();
  console.log(annotations)
  if(annotations.length == 0){
    decryptionSyntaxFlag = false;

    var solver = decrypter.getSession().getValue();
    var hi;
    solver = "hi = " + solver; //have no idea why this works, but it enables eval to actually be a function so I'll take it.

    var words = (numToWords(encryptWords(current_game.encrypted, answerWrapper(solver))));
    showAnswer(words);
    socket.emit('answer', {gameId:current_game.id, guess:words});
  }else{
    encryptionSyntaxFlag = true;
    badCode();
  }
}


function answerWrapper(answer){
  //ensure global functions aren't being used
  //doesn't work but It enables me to make local copies of any variables
  this.alphabet = alphabet.slice(0);
  this.console = console;
  return eval.call(this, answer);

}

function checkAnswer(data){
  if(data.solved){
    alert("answer solved", data.guess);
    current_game.decrypted = data.guess;
  }else{
    alert("answer failed", data.guess);
  }
}

function encryptWords(words, func){

  if(!encryptionSyntaxFlag && !decryptionSyntaxFlag){
    var w;
    try{
      //console.log(words)
      w = words.map(func);

    }catch(e){
      console.log("Syntax Error " + e.message);
    }
    return w;
  }
  alert("Code has some errors");
  return null;
}


function getRandomWords(id){
  var words = wordPool[id%wordPool.length];
  //console.log(words);
  return wordsToNum(words);
}

function wordsToNum(words){
  var w = words.split('').map(function(char){
    return alphabet.indexOf(char);
  });
  //console.log(w);
  return w;
}

function numToWords(words){
  //console.log(encryptWords(words,reverseCipher));
  var w = words.map(function(char){
    return alphabet[parseInt(char)];
  });
  w = w.join('');
  //console.log(w);
  return w;
}

function charToNum(char){
  return alphabet.indexOf(char);
}
function numToChar(num){
  if(num >= alphabet.length || num < 0){
    return '@'
  }else
    return alphabet[num];
}


function simpleCipher(char){
  char = char+5;
  while(char >= alphabet.length){
    char -= alphabet.length;
  }
  return char;
}

function reverseCipher(char){
  var c = char-5;
  if(c <0){
    c = alphabet.length+c;
  }
  return c;
}


window.onload = init;

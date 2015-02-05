var game;
var alphabet = [' ','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p',
'q','r','s','t','u','v','w','x','y','z'];
var socket;
var encryptionMethod;
function init(){
  $('#encrypter').text("function solver(char, index, wordArray){ char = char+5; while(char >= alphabet.length){char -= alphabet.length;}return char;}");

  socket = io('http://localhost:3000');
  socket.on('gameCreated', createGame);
  socket.on('finishedSetup', setUpViews);
  socket.on('checkedAnswer', checkAnswer)

}

function startGame(){
  initViews();
  parseEncrptionMethod();
  socket.emit('createGame');
}
function initViews(){
  $('#solver').text("function solver(char, index, wordArray){ return char;}");
}

function parseEncrptionMethod(){
  var encrypter = $('#encrypter').val();
  var bye;
  encrypter = "bye = " + encrypter; //have no idea why this works, but it enables eval to actually be a function so I'll take it.
  encryptionMethod = answerWrapper(encrypter);
}

function createGame(data){

  var thisGameId = data.gameId;
  //console.log(data);
  var words = String(data.words) //getRandomWords(thisGameId);
  var guess = encryptWords(wordsToNum(words), encryptionMethod);
  //console.log(guess);
  socket.id = data.id;
  game = {id:thisGameId, decrypted:words, encrypted:guess};
  socket.emit('setGameEncryption', {id:socket.id, gameId:thisGameId, encrypted:guess});
  //console.log(socket);

//  alert('gameReady');

}


function encryptWords(words, func){
  //console.log(words)
  return words.map(func);
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

function setUpViews(guess){
  $('#cipher').text(numToWords(game.encrypted));

}

function answer(){
  var solver = $('#solver').val();
  var hi;
  solver = "hi = " + solver; //have no idea why this works, but it enables eval to actually be a function so I'll take it.

  //console.log(answerWrapper(solver)('1'));
  console.log(solver);

  var words = (numToWords(encryptWords(game.encrypted, answerWrapper(solver))));
  $('#cipher').text(words);
  socket.emit('answer', {gameId:game.id, guess:words});
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
    console.log("answer solved");
  }else{
    console.log("answer failed");
  }
}


window.onload = init;

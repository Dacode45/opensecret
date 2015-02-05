The project is a multiplayer crypto game using socket io
Main files are game.js in bin and g.js in public/javascripts

run project using npm start.

Here's the control flow for g.
initGame
  Connect socket. Initialize the encryption view. set up handlers.
startGame
  Called by button in index.ejs initializes the views and creates the game on the server bby having the socket emit "create game".
Server creates a game which has a string from the word_pool to be encrypted and sends that to client
client gets game and encrypts the string telling the server that it encrypted the string. server calls finished set up once it has the encrypted string. Note
server has no way to decrypt the string.
Once the client learns the server has finished setting up the game, it lets
the user enter a function for decryption. the function may have 3 parameters
char //the current character in string
index // the index of the char in string
stringArr //array of chars representing entire string.
the function must return a char in order to decrypt.

CHARS ARE NOT UTF 8. I set up a simple alphabet map covering all lowercase
letters and space for simplicity.

When the answer function is pushed the client uses the function to decrypt
the string and sends the decyrpted string to the server. the server checks
if the client string === the right string. if it does it says the game is solved
or not.

so far there's only one player per game but it can be scaled relatively easily.

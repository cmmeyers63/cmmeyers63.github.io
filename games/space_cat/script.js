// *** INITIALIZATION ***

// Canvas initialization
var canvas = document.getElementById("test");
var rect = canvas.getBoundingClientRect();
var ctx = canvas.getContext("2d");

// Window dimensions
canvas.width = rect.width;
canvas.height = rect.height;
var WINDOW_WIDTH = canvas.width;
var WINDOW_HEIGHT = canvas.height;

// Lander dimensions
var LANDER_WIDTH = 0.07 * WINDOW_WIDTH;
var LANDER_HEIGHT = LANDER_WIDTH;

// Image initialization
var catlander = new Image();
catlander.src = "images/catlander.png";

var catlanderb1 = new Image();
catlanderb1.src = "images/catlanderb1.png";

var catlanderb2 = new Image();
catlanderb2.src = "images/catlanderb2.png";

var explosion = new Image();
explosion.src = "images/explosion1.png";

var img = catlander;

// Audio initialization
var boosterSound = new Audio("audio/thruster.mp3");
boosterSound.loop = true;
boosterSound.volume = 0.5;

var backgroundSound = new Audio("audio/space.flac");
backgroundSound.loop = true;
backgroundSound.volume = 0.2;

var explosionSound = new Audio("audio/bomb.mp3");
explosionSound.volume = 0.5;

// Constant initialization
var ROCKET_ACCEL = 0.03;
var GRAVITY; 
var TERMINAL_VELOCITY_DOWN = 4;
var TERMINAL_VELOCITY_UP = 3;

var FUEL_ADDED_SCALAR = 7; 

var FUEL_CONSUMPTION_RATE = 1;

var STARS_SIZE = 8; 
var GROUND_HEIGHT = LANDER_HEIGHT;

var LANDING_SPOT_START = Math.random() * (WINDOW_WIDTH - 2 * LANDER_WIDTH);
var LANDING_SPOT_HEIGHT = LANDER_HEIGHT / 4;

// Variable initialization
var landerX = WINDOW_WIDTH / 2;
var landerY = WINDOW_HEIGHT / 2;
var landerDX = 0;
var landerDY = 0;
var landerTheta = 0;

var forwardX = true;
var forwardY = true;

var goForward = false;
var rotateCounterClockwise = false;
var rotateClockwise;

var crash = false;
var crashSpeed = 0.5;
var crashReason = "";

var landed = false; 

// Static world objects
var stars = [];
var groundPoints = [];
groundPoints.length = canvas.width;

// Variables in persistent memory
var level;
if (localStorage.getItem("level") === null) {
  level = 1;
} else {
  level = parseInt(localStorage.getItem("level"));
}

var fuel;
if (localStorage.getItem("fuel") === null) {
  fuel = 1000;
} else {
  fuel = localStorage.getItem("fuel");
}

var score; 
if (localStorage.getItem("score") === null) {
  score = 0;
} else {
  score = parseFloat(localStorage.getItem("score"));
}

// Constants dependent on level 
if (level < 9){
  var LANDING_SPOT_WIDTH = LANDER_WIDTH * (1 + (10 - level) / 10);
}
else { // past level 9 the size no longer shrinks
  var LANDING_SPOT_WIDTH = LANDER_WIDTH * (11 / 10);
}

// Debugging
var debugPrint = false;

// *** EVENT LISTENERS ***

// Arrow key pressing
let keysPressed = {};

document.addEventListener('keydown', (event) => {
  GRAVITY = 0.0135;
  keysPressed[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
});

// *** GAME ***

startGame();

// *** HELPER FUNCIONS ***

// Changes movement of lander
function landerMovement() {
  // ArrowUp = fly forwards
  if (keysPressed['ArrowUp'] && fuel > 0) {
    landerDX += ROCKET_ACCEL * Math.sin(landerTheta);
    landerDY -= ROCKET_ACCEL * Math.cos(landerTheta);
    goForward = false;

    fuel -= FUEL_CONSUMPTION_RATE;

    boosterSound.play();
    backgroundSound.play();

    if (Math.random() > 0.5) {
      img = catlanderb1;
    } else {
      img = catlanderb2;
    }
  } 
  else {
    img = catlander;

    boosterSound.pause();
  }
  // ArrowRight = rotate CW
  if (keysPressed['ArrowRight']) {
    landerTheta += .02;
    rotateClockwise = false;
  }
  // ArrowLeft = rotate CCW
  else if (keysPressed['ArrowLeft']) {
    landerTheta -= .02;
    rotateCounterClockwise= false;
  }

  // god-level control
  // secret dev control key
  else if (keysPressed['[']) {
    landerTheta = 0;
    rotateClockwise = false;
    rotateCounterClockwise = false;
    landerDX = 0;
    landerDY = 0.1;
  }

  landerDY += GRAVITY;

  landerY += landerDY;
  landerX += landerDX;  

  // Terminal velocity checks
  if (landerDY > TERMINAL_VELOCITY_DOWN) {
    landerDY = TERMINAL_VELOCITY_DOWN;
  }
  if (landerDY < -TERMINAL_VELOCITY_UP) {
    landerDY = -TERMINAL_VELOCITY_UP;
  }
  if (landerTheta > Math.PI * 2) {
    landerTheta = 0;
  }
  if (landerTheta < 0){
    landerTheta = Math.PI * 2;
  }
}

function checkBoundaries() {
  // Set horizontal bounds
  // Left border
  if (landerX - LANDER_WIDTH / 2 < 0) {
    landerX = LANDER_WIDTH / 2;
    landerDX = 0;
  }
  // Right border
  if (landerX + LANDER_WIDTH / 2 > WINDOW_WIDTH) {
    landerX = WINDOW_WIDTH - LANDER_WIDTH / 2;
    landerDX = 0;
  }
  
  // Set vertical bounds
  // Bottom of the screen
  if (landerY + GROUND_HEIGHT + LANDER_HEIGHT / 2 * (0.78 + (Math.sqrt(2) - 1) * Math.abs(Math.cos(2*(landerTheta + Math.PI/4)))) > WINDOW_HEIGHT) {
    checkIfCrash(); 
    landerY = WINDOW_HEIGHT - GROUND_HEIGHT - LANDER_HEIGHT / 2 * (0.78 + (Math.sqrt(2) - 1) * Math.abs(Math.cos(2*(landerTheta + Math.PI/4))))
    landerDY = 0;
  }
}

// Increments the score based on landing speed and level 
function incrementScore(){
  var speed = Math.sqrt(Math.pow(landerDX, 2) + Math.pow(landerDY, 2));

  score = (score + 10 * (crashSpeed - speed) * level).toPrecision(2);
}

// Change the level
function changeLevel() {  
  level += 1;

  // give some fuel back 
  if (level < 10){
    fuel += score * FUEL_ADDED_SCALAR; 
  }

  localStorage.setItem("level", level);
  localStorage.setItem("fuel", fuel);
  localStorage.setItem("score", score);
}

// Clear everything from level
function clearLevel() {
  localStorage.removeItem("level");
  localStorage.removeItem("fuel");
  localStorage.removeItem("score");
}

// Checks for crash landing
function checkIfCrash() {
  var speed = Math.sqrt(Math.pow(landerDX, 2) + Math.pow(landerDY, 2));
  
  // On landing pad?
  if (landerX - LANDER_WIDTH / 2 <= LANDING_SPOT_START || landerX + LANDER_WIDTH / 2 >= LANDING_SPOT_START + LANDING_SPOT_WIDTH) {
    crash = true;
    crashReason = "You Missed the landing pad!";
  }
  // Slow enough?
  else if (speed > crashSpeed) {
    crash = true;
    crashReason = "You hit the ground too hard!";
  }
  // Correct orientation?
  else if (landerTheta >= 0.2 && landerTheta <= (2 * Math.PI) - 0.2) {
    crash = true;
    crashReason = "The lander was tilted too much!";
  }
  else {
    landed = true;
  }
} 

// Explosion
function explode() {
  img = explosion;
  gameDraw();
    
  explosionSound.play();
}

// *** BACKGROUND AND DISPLAY FUNCTIONS ***

// Draws background
function drawBackground(){
  ctx.clearRect(0,0, canvas.width, canvas.height); // clear frame

  // red background
  ctx.rect(0, 0, canvas.width, canvas.height - GROUND_HEIGHT);
  ctx.fillStyle = "#4a0e09";
  ctx.fill();

  // draw collection of stars
  if (stars.length > 0){
    let i = 0;
    for (const star of stars){   
      var gradient = ctx.createRadialGradient(star.posX, star.posY, 0, star.posX, star.posY, Math.ceil(star.size));

      // add some variance to the stars by adjusting the color stops of the gradient 
      if (i % 3 == 0){
        gradient.addColorStop(0, '#f1f1f1');
        gradient.addColorStop(.3, '#ebf8e1'); 
        gradient.addColorStop(1, 'black'); 
      }
      else if (i % 4 == 0){
        gradient.addColorStop(0, '#f1f1f1');
        gradient.addColorStop(.3, '#ebf8e1'); 
        gradient.addColorStop(1, 'cyan'); 
      }
      else if (i % 2 == 0){
        gradient.addColorStop(0, '#f1f1f1');
        gradient.addColorStop(.3, '#ebf8e1'); 
        gradient.addColorStop(1, 'purple'); 
      }
      else{
        gradient.addColorStop(0, '#f1f1f1');
        gradient.addColorStop(.3, '#ebf8e1'); 
        gradient.addColorStop(1, '#f69d3c'); 
      }
      ctx.beginPath();
      ctx.arc(star.posX, star.posY, star.size, 0, 2*Math.PI, false)
      ctx.fillStyle = gradient;
      ctx.fill();
      ++i;
    }    
  }

  // grey land
  ctx.beginPath();
  ctx.rect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
  ctx.fillStyle = "#dddddd";
  ctx.fill();

  // landing spot
  ctx.beginPath();
  ctx.rect(LANDING_SPOT_START, canvas.height - GROUND_HEIGHT, LANDING_SPOT_WIDTH, LANDING_SPOT_HEIGHT);
  ctx.fillStyle = "#0000ff";
  ctx.fill();
}

// checks if a element to be drawn will conflict 
// with existing elements (status bar, ground)
function checkUICollision(x,y){
  return true;
}

// Set up background elements
function setupBackground(){
  // build stars collection 
  for (let i = 0; i < canvas.width; ++i){
    for (let j = 0; j < canvas.height; ++j){
      let rand = Math.random(); 
      if ( (i % 2 === 0) && (j % 2 === 0) && rand > .9992){
        let starAttributes = 
        {
          posX: i,
          posY: j, 
          size: STARS_SIZE * Math.random()
        };
        stars.push(starAttributes);
      }
    }
  }
}

// displays a menu for user interaction upon landing or crashing
// gameOver : false = red box -> display stats
//          : true = green box -> display di
function displayMenu(menuText, gameOver, actionFunction) {
  var xMargin = WINDOW_WIDTH * 0.15;
  var yMargin = WINDOW_HEIGHT * 0.15;
  var menuWidth = WINDOW_WIDTH - (2 * xMargin);
  var menuHeight = WINDOW_HEIGHT - (2 * yMargin);

  // draw white background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(xMargin, yMargin, menuWidth, menuHeight);

  // draw border
  ctx.beginPath();
  var borderWidth = 10;
  ctx.strokeRect(xMargin + borderWidth, yMargin + borderWidth, menuWidth - (borderWidth*2), menuHeight - (borderWidth*2));
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#000000";
  ctx.stroke();

  // draw restart button
  var buttonX = xMargin * 2;
  var buttonY = yMargin * 2;
  var buttonWidth = menuWidth - buttonX;
  var buttonHeight = 0.4 * (menuHeight - buttonY);

  if (gameOver){
    ctx.fillStyle = "red";
  }
  else {
    ctx.fillStyle = "#00AA22";
  }

  ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

  // button border
  ctx.beginPath();
  var borderWidth = 2;
  ctx.strokeRect(buttonX + borderWidth, buttonY + borderWidth, buttonWidth - (2 * borderWidth), 0.5 * (2 * buttonHeight - (2 * borderWidth)));
  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = "#000000";
  ctx.stroke();
  
  // button text
  ctx.font = buttonWidth / 8 + "px Caribou";
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";

  if (gameOver){
    ctx.fillText("GAME OVER", 0.5 * WINDOW_WIDTH, 2.5 * yMargin);
  }
  else {
    ctx.fillText("Level Passed", 0.5 * WINDOW_WIDTH, 2.5 * yMargin);
  }

  ctx.font = buttonWidth / 10 + "px Caribou";
  ctx.fillText(menuText, 0.5 * WINDOW_WIDTH, 2.9 * yMargin);

  // display stats
  ctx.font = buttonWidth / 8 + "px Caribou";
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";

  if (gameOver){
    ctx.fillText(crashReason, 0.5 * WINDOW_WIDTH, 1.6 * yMargin);
  }else if (level < 10){
    ctx.fillText("Fuel Added: " + Math.round(score * FUEL_ADDED_SCALAR), 0.5 * WINDOW_WIDTH, 1.6 * yMargin);
  }else{
    ctx.fillText("No Fuel Boost Left! ", 0.5 * WINDOW_WIDTH, 1.6 * yMargin);
  }

  ctx.fillText("Level: " + level, 0.5 * WINDOW_WIDTH, 3.8 * yMargin);
  ctx.fillText("Score: " + score, 0.5 * WINDOW_WIDTH, 4.4 * yMargin);
  ctx.fillText("Fuel: " + Math.round(fuel), 0.5 * WINDOW_WIDTH, 5.0 * yMargin);

  // mouse listener
  canvas.addEventListener("click", function(event) {
    var clickX = ((event.clientX  - rect.left) / rect.width) * canvas.width;
    var clickY = ((event.clientY - rect.top) / rect.height) * canvas.height;

    if (clickX >= buttonX 
      && clickX <= (buttonX + buttonWidth)
      && clickY >= buttonY
      && clickY <= (buttonY + buttonWidth)) 
    {
      actionFunction();
    }
  }, false);
}

// *** BASE GAME FUNCTIONS ***

// Updates game state
function gameUpdate() {
  landerMovement();
  checkBoundaries();
}

// Draws on the canvas
function gameDraw() {  
  clearFrame();
  
  ctx.translate(landerX, landerY);
  ctx.rotate(landerTheta);
  ctx.drawImage(img, -LANDER_WIDTH / 2, -LANDER_HEIGHT /2, LANDER_WIDTH, LANDER_HEIGHT);
  ctx.resetTransform(); // reset transformation to identity matrix

  ctx.beginPath();
  ctx.font = "30px Caribou";
  ctx.fillStyle = "#f1f1f1";
  ctx.fillText("Level: " + level, 10, 30);

  ctx.beginPath();
  ctx.font = "15px Caribou";
  ctx.fillStyle = "#f1f1f1";
  ctx.fillText("Score: " + Math.round(score), 10, 60);
  ctx.fillText("Fuel: " + Math.round(fuel), 10, 90);

  ctx.beginPath();
  ctx.font = "12px Caribou";
  ctx.fillStyle = "#f1f1f1";
  ctx.fillText("Horizontal Speed: " + Math.abs(landerDX.toPrecision(2)), 10, 120);
  ctx.fillText("Vertical Speed: " + -1*landerDY.toPrecision(2), 10, 150);

  if (debugPrint) {
    ctx.fillText("Theta: " + landerTheta.toPrecision(3), 10, 180);
    ctx.fillText("Pos: " + Math.round(landerX) + ", " + Math.round(landerY), 10, 210);
    ctx.fillText("Crash: " + crash, 10, 240);
    ctx.fillText("Landed: " + landed, 10, 270);
  }
}

// Clears canvas
function clearFrame(){
  drawBackground();
}

// Game Loop
function gameRun() {
  gameUpdate();
  gameDraw();
  
  if (crash) {
    explode();

    stopGame();
    displayMenu("Restart Game", true, restartGame);
  } 
  else if (landed) {    
    incrementScore();

    stopGame();
    displayMenu("Next Level", false, restartGame);
  } 
}

// Important game variable
var intervalID;

// Start the game
function startGame() {
  setupBackground(); 
  var fps = 60;
  intervalID = setInterval(gameRun, 1000 / fps);
  GRAVITY = 0;
}

// Stop the game
function stopGame() {
  clearInterval(intervalID);

  boosterSound.pause();
}

// Restart game on game over or next level
function restartGame(){
  // save persistent memory if leveling up, else reset
  if (landed) {
    changeLevel();
  } 
  else {
    clearLevel();
  }

  location.reload();
}
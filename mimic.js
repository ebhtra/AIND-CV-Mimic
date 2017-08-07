// Mimic Me!
// Fun game where you need to express emojis being displayed

// --- Affectiva setup ---

// The affdex SDK Needs to create video and canvas elements in the DOM
var divRoot = $("#camera")[0];  // div node where we want to add these elements
var width = 640, height = 480;  // camera image size
var faceMode = affdex.FaceDetectorMode.LARGE_FACES;  // face mode parameter

// Initialize an Affectiva CameraDetector object
var detector = new affdex.CameraDetector(divRoot, width, height, faceMode);

// Enable detection of all Expressions, Emotions and Emojis classifiers.
detector.detectAllEmotions();
detector.detectAllExpressions();
detector.detectAllEmojis();
detector.detectAllAppearance();

// --- Utility values and functions ---

// Unicode values for all emojis Affectiva can detect
var emojis = [ 128528, 9786, 128515, 128524, 128527, 128521, 128535, 128539, 128540, 128542, 128545, 128563, 128561 ];

// Update target emoji being displayed by supplying a unicode value
function setTargetEmoji(code) {
  $("#target").html("&#" + code + ";");
}

// Convert a special character to its unicode value (can be 1 or 2 units long)
function toUnicode(c) {
  if(c.length == 1)
    return c.charCodeAt(0);
  return ((((c.charCodeAt(0) - 0xD800) * 0x400) + (c.charCodeAt(1) - 0xDC00) + 0x10000));
}

// Update score being displayed
function setScore(correct, total) {
  $("#score").html("Score: " + correct + " / " + total);
}

// Display log messages and tracking results
function log(node_name, msg) {
  $(node_name).append("<span>" + msg + "</span><br />")
}

// --- Callback functions ---

// Start button
function onStart() {
  if (detector && !detector.isRunning) {
    $("#logs").html("");  // clear out previous log
    detector.start();  // start detector
  }
  log('#logs', "Start button pressed");
  startGame(); // in case user hits this button to restart a game
}

// Stop button
function onStop() {
  log('#logs', "Stop button pressed");
  if (detector && detector.isRunning) {
    detector.removeEventListener();
    detector.stop();  // stop detector
  }
};

// Reset button
function onReset() {
  log('#logs', "Reset button pressed");
  if (detector && detector.isRunning) {
    detector.reset();
  }
  $('#results').html("");  // clear out results
  $("#logs").html("");  // clear out previous log

  // TODO(optional): You can restart the game as well
  // <your code here>
  startGame();
};

// Add a callback to notify when camera access is allowed
detector.addEventListener("onWebcamConnectSuccess", function() {
  log('#logs', "Webcam access allowed");
});

// Add a callback to notify when camera access is denied
detector.addEventListener("onWebcamConnectFailure", function() {
  log('#logs', "webcam denied");
  console.log("Webcam access denied");
});

// Add a callback to notify when detector is stopped
detector.addEventListener("onStopSuccess", function() {
  log('#logs', "The detector reports stopped");
  $("#results").html("");
});

// Add a callback to notify when the detector is initialized and ready for running
detector.addEventListener("onInitializeSuccess", function() {
  log('#logs', "The detector reports initialized");
  //Display canvas instead of video feed because we want to draw the feature points on it
  $("#face_video_canvas").css("display", "block");
  $("#face_video").css("display", "none");

  // TODO(optional): Call a function to initialize the game, if needed
  // <your code here>
  startGame();
});

// Add a callback to receive the results from processing an image
// NOTE: The faces object contains a list of the faces detected in the image,
//   probabilities for different expressions, emotions and appearance metrics
detector.addEventListener("onImageResultsSuccess", function(faces, image, timestamp) {
  var canvas = $('#face_video_canvas')[0];
  if (!canvas)
    return;

  // Report how many faces were found
  $('#results').html("");
  log('#results', "Timestamp: " + timestamp.toFixed(2));
  log('#results', "Number of faces found: " + faces.length);
  if (faces.length > 0) {
    // Report desired metrics
    log('#results', "Appearance: " + JSON.stringify(faces[0].appearance));
    log('#results', "Emotions: " + JSON.stringify(faces[0].emotions, function(key, val) {
      return val.toFixed ? Number(val.toFixed(0)) : val;
    }));
    log('#results', "Expressions: " + JSON.stringify(faces[0].expressions, function(key, val) {
      return val.toFixed ? Number(val.toFixed(0)) : val;
    }));
    log('#results', "Emoji: " + faces[0].emojis.dominantEmoji);

    // Call functions to draw feature points and dominant emoji (for the first face only)
    drawFeaturePoints(canvas, image, faces[0]);
    drawEmoji(canvas, image, faces[0]);
    
    // TODO: Call your function to run the game (define it first!)
    // <your code here>
    if (gameOver) { // Start a new game with a new emoji
      gameOver = false;
      showNextEmoji(timestamp);
    }
    // Main engine of the game:
    compareFaces(faces[0].emojis.dominantEmoji, timestamp);
  }
});


// --- Custom functions ---

// Draw the detected facial feature points on the image
function drawFeaturePoints(canvas, img, face) {
  // Obtain a 2D context object to draw on the canvas
  var ctx = canvas.getContext('2d');

  // TODO: Set the stroke and/or fill style you want for each feature point marker
  // See: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D#Fill_and_stroke_styles
  // <your code here>
  ctx.strokeStyle = "#FFFFFF";  // white color
  //console.log(face);
  // Loop over each feature point in the face
  for (var id in face.featurePoints) {
    var featurePoint = face.featurePoints[id];

    // TODO: Draw feature point, e.g. as a circle using ctx.arc()
    // See: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/arc
    // <your code here>
    ctx.beginPath();
    // Draw a small, white circle centered on each feature point
    ctx.arc(featurePoint.x, featurePoint.y, 1.5, 0, 2*Math.PI);
    ctx.stroke();
  }
}

// Draw the dominant emoji on the image
function drawEmoji(canvas, img, face) {
  // Obtain a 2D context object to draw on the canvas
  var ctx = canvas.getContext('2d');
  // Use the distance between eyes to measure and place the emoji
  var innerLeftEyeX = face.featurePoints[18].x ;
  var outerRightEyeX = face.featurePoints[16].x ;
  var eyeY = face.featurePoints[16].y ; // just use right eye for vertical loc
  var emojiSize = innerLeftEyeX - outerRightEyeX;
  
  // TODO: Set the font and style you want for the emoji
  // <your code here>
  ctx.font = emojiSize + 'px Serif'; // arbitrary choice of Serif
  // TODO: Draw it using ctx.strokeText() or fillText()
  ctx.fillText(face.emojis.dominantEmoji, outerRightEyeX - 1.4 * emojiSize, eyeY);
  // See: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText
  // TIP: Pick a particular feature point as an anchor so that the emoji sticks to your face
  // <your code here>

}

// TODO: Define any variables and functions to implement the Mimic Me! game mechanics

// NOTE:
// - Remember to call your update function from the "onImageResultsSuccess" event handler above
// - You can use setTargetEmoji() and setScore() functions to update the respective elements
// - You will have to pass in emojis as unicode values, e.g. setTargetEmoji(128578) for a simple smiley
// - Unicode values for all emojis recognized by Affectiva are provided above in the list 'emojis'
// - To check for a match, you can convert the dominant emoji to unicode using the toUnicode() function

// Optional:
// - Define an initialization/reset function, and call it from the "onInitializeSuccess" event handler above
// - Define a game reset function (same as init?), and call it from the onReset() function above

// <your code here>
var TimePerFace = 7;  // amount of seconds given to mimic and see result
var FacesPerRound = 12;  // how many faces for player to mimic per turn

var score;  // current score counter
var targetFace;  // current target emoji unicode
var startTime;  // time zero for current target emoji
var facesTried;  // current attempts counter
var gameOver = true;   // Boolean used to keep track of game status
var justWon = true;  // Boolean to show alert for last success/failure

function randomChoice(list) {
  // Randomly choose and return an item from a list provided as argument
  randIndex = Math.floor(Math.random() * list.length);
  return list[randIndex];
};

function compareFaces(looksLike, atTime) {
  // Compare the player's dominant emoji to the target one, at a given time,
  //    and determine the resulting course of game play.
  if (atTime - startTime < 2) {  // display most recent success/failure for 2 secs
    setTargetEmoji(justWon ? 128582 : 128581);
  } else if (atTime - startTime > TimePerFace) { // failure to mimic in time
    setScore(score, ++facesTried);
    justWon = false;
    showNextEmoji(atTime);
  } else if (toUnicode(looksLike) === targetFace) { // score a point for good mimic
    setScore(++score, ++facesTried);
    justWon = true;
    showNextEmoji(atTime);
  } else {  // After 2 seconds of showing latest result, update target display
    setTargetEmoji(targetFace);
  }
};
  
function showNextEmoji(atTime) {
  if (facesTried >= FacesPerRound) {
    endGame();
  } else {  // reset the timer and pick a new emoji
    startTime = atTime;
    randomEmojiCode = randomChoice(emojis);  // Pick next emoji code from list
    setTargetEmoji(randomEmojiCode); // Update what the screen shows for a target
    targetFace = randomEmojiCode;  // Update the target variable         
  }
};
  
function endGame() {
  detector.stop();
  gameOver = true;
  setTargetEmoji(127937); // Display checkered flag      
};

function startGame() {
  //  Reset counter variables and displays
  setTargetEmoji(9898); // Show mirror-like circle where target emoji will be 
  setScore(0, 0);
  score = 0;
  facesTried = 0;      
};
        

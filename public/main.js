const initialState = document.getElementById("initial-state");
const endState = document.getElementById("end-state");
const playingState = document.getElementById("playing-state");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const finalScore = document.getElementById("final-score");
const textInput = document.getElementById("user-input");
const wordForm = document.getElementById("user-input-form");
const wordDisplay = document.getElementById("target-word");
const statusDisplay = document.getElementById("status-message");
const scoreDisplay = document.getElementById("score");
const previousGuessesDisplay = document.getElementById("guesses-row");
let dictionary = {};
let dictionaryLoaded = false;
let targetWord = "";
let targetPronunciation = "";
let targetASCIIBET = "";
let maxEditDistance = 0;
let statusTimeoutID;
let countdownInterval;
let score = 0;
let timer;
let timeLeft = 119; // 2 minutes in seconds minus 1 for the delay in loading
const badGuesses = new Set();
const strongGuesses = new Set();
const weakGuesses = new Set();
const finalGuesses = [];
loadDictionary();

async function loadDictionary() {
  try {
    const response = await fetch("./dictionary.json");
    dictionary = await response.json();
    dictionaryLoaded = true;
  } catch (error) {
    console.error("Error loading dictionaries:", error);
    alert("Error loading dictionaries. Please try refreshing the page.");
  }
}
function startCountdown() {
  // HACK TO GET AROUND MOBILE KEYBOARD ISSUE on IOS
  const dumb = document.createElement("input");
  dumb.setAttribute("type", "text");
  dumb.style.position = "absolute";
  dumb.style.opacity = 0;
  dumb.style.height = 0;
  dumb.style.width = 0;
  dumb.style.fontSize = "16px";
  document.body.prepend(dumb);
  dumb.focus();
  setTimeout(() => {
    textInput.focus();
    dumb.remove();
  }, 3010);
  // END HACK

  let countdownNumber = 2;
  const countdownElement = document.getElementById("countdown-number");

  initialState.classList.add("hidden");
  document.getElementById("countdown").classList.remove("hidden");

  countdownInterval = setInterval(function () {
    if (countdownNumber <= 0) {
      clearInterval(countdownInterval);
      document.getElementById("countdown").classList.add("hidden");
      startGame();
    } else {
      countdownElement.textContent = countdownNumber;
      countdownNumber--;
    }
  }, 1000);
}
function startTimer() {
  timer = setInterval(function () {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById("timer").textContent = `${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      endGame();
    }

    timeLeft--;
  }, 1000);
}
function startGame() {
  initialState.classList.add("hidden");
  playingState.classList.remove("hidden");
  startTimer();
  // Get a random word from the dictionary
  if (!dictionaryLoaded) return;
  const words = Object.keys(dictionary);
  targetWord = words[Math.floor(Math.random() * words.length)];
  wordDisplay.textContent = targetWord;
  // most common pronunciation is the first one
  targetPronunciation = dictionary[targetWord][0];
  targetASCIIBET = convertToASCIIBET(targetPronunciation);
  maxEditDistance = targetASCIIBET.length;
}
function endGame() {
  resetGameVariables();
  // Show the final words and more info about them
}
// Listen for the start button to be clicked
startButton.addEventListener("click", startCountdown);
// Listen for the restart button to be clicked
restartButton.addEventListener("click", function () {
  endState.classList.add("hidden");
  initialState.classList.remove("hidden");
  score = 0;
  // Reset your game logic here
});

// Listen for form submit
wordForm.addEventListener("submit", function (event) {
  event.preventDefault();

  // Get the user input
  const userInput = normalize(textInput.value);
  if (pronunciationExists(userInput)) {
    // see if the user has already guessed this word
    if (strongGuesses.has(userInput)) {
      updateStatusMessage(`Already found "${userInput}"`);
    } else {
      handleKnownPronunciation(userInput);
    }
  } else {
    // see if the user has already guessed this word
    if (badGuesses.has(userInput)) {
      updateStatusMessage(`Already tried unknown word "${userInput}"`);
    } else {
      // update status to show that the word is not in the dictionary
      updateStatusMessage(`"${userInput}" not found in dictionary`);
      // add the word to the bad guesses set
      badGuesses.add(userInput);
    }
  }
  textInput.value = "";
});

// UTILITY FUNCTIONS

// function to handle guesses with a known pronunciation
function handleKnownPronunciation(userInput) {
  // we assume that we haven't already guessed this word
  // find the pronunciation that has the fewest edits from the user input
  const [testPronunciation, testDistance] = getClosestPronunciation(userInput);

  // first we check to see if the pronunciation is a perfect rhyme
  if (isPerfectRhyme(testPronunciation, targetPronunciation)) {
    // calculate the score, add it to the total, and update the score display
    let points = 0;
    if (testDistance === 0) {
      // update status message because this is a "rich rhyme"
      updateStatusMessage(`"${userInput}" is a rich rhyme! +30 points`);
      updateScore(30);
      points = 30;
    } else {
      // calculate bonus points for a perfect rhyme as the inverse of the edit distance
      const bonusPoints = Math.ceil(10 / testDistance);

      // update status message to show perfect rhyme, 10 points plus bonus points
      updateStatusMessage(
        `Perfect rhyme! +10 points +${bonusPoints} phonetic bonus`
      );
      // update the score
      updateScore(10 + bonusPoints);
      points = 10 + bonusPoints;
    }
    // add the word to our strong guesses set
    strongGuesses.add(userInput);
    // update the display of guesses
    updatePreviousGuesses(userInput);
    // add the word and associated info to the final guesses array
    finalGuesses.push({
      word: userInput,
      pronunciation: testPronunciation,
      distance: testDistance,
      points: points,
      category: "perfect",
    });
  }
}

// compare two pronunciations to see if they are a perfect rhyme
function isPerfectRhyme(testPronunciation, targetPronunciation) {
  // get the stressed part of the pronunciation
  const testStressed = getStressedRhymePart(testPronunciation);
  const targetStressed = getStressedRhymePart(targetPronunciation);
  return testStressed === targetStressed;
}

// helper to get the stressed part of a pronunciation
function getStressedRhymePart(pronunciation) {
  let targetIndex = pronunciation.length;
  const stresses = ["1", "2", "0"];

  for (const stress of stresses) {
    const index = pronunciation.lastIndexOf(stress);
    if (index !== -1 && index < targetIndex) {
      targetIndex = index;
      break;
    }
  }
  return pronunciation.slice(targetIndex - 2);
}

// function to get the closest pronunciation to the target pronunciation from multiple dictionary options for one spelling of a word
// return the closest pronunciation and the edit distance
function getClosestPronunciation(userInput) {
  // find the pronunciation that has the fewest edits from the user input
  // there might be only one pronunciation for a word
  let bestPronunciation = "";
  let bestDistance = Infinity;
  let testASCIIBET = "";
  if (dictionary[userInput].length === 1) {
    bestPronunciation = dictionary[userInput][0];
    testASCIIBET = convertToASCIIBET(bestPronunciation);
    bestDistance = editDistance(targetASCIIBET, testASCIIBET);
    return [bestPronunciation, bestDistance];
  }

  for (const pronunciation of dictionary[userInput]) {
    testASCIIBET = convertToASCIIBET(pronunciation);
    const distance = editDistance(targetASCIIBET, testASCIIBET);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestPronunciation = pronunciation;
    }
  }
  return [bestPronunciation, bestDistance];
}

// reset all the game state variables
function resetGameVariables() {
  score = 0;
  timeLeft = 119;
  document.getElementById("timer").textContent = "2:00";
  document.getElementById("countdown-number").textContent = "3";
  textInput.value = "";
  badGuesses.clear();
  targetASCIIBET = "";
  targetPronunciation = "";
  targetWord = "";
  maxEditDistance = 0;
  clearInterval(timer);
  clearInterval(countdownInterval);
}
function normalize(word) {
  return word.trim().toUpperCase();
}
//check if pronunciation exists in dictionary
function pronunciationExists(word) {
  if (!dictionaryLoaded) return;
  if (dictionary[word]) return true;
}

function updateStatusMessage(message) {
  if (statusTimeoutID) clearTimeout(statusTimeoutID);

  // Remove any existing fade-out class and set opacity back to 1
  statusDisplay.classList.remove("fade-out");
  statusDisplay.style.opacity = 1;

  // Update the message
  statusDisplay.textContent = message;

  // Trigger reflow to restart the animation
  void statusDisplay.offsetWidth;

  // Add the fade-out class to start the fade-out animation
  statusDisplay.classList.add("fade-out");

  // Clear the message and remove the fade-out class after the animation duration (3000ms)
  statusTimeoutID = setTimeout(() => {
    statusDisplay.textContent = "";
    statusDisplay.classList.remove("fade-out");
  }, 3000);
}

function convertToASCIIBET(pronunciation) {
  const phones = {
    AH0: "!",
    N: "N",
    T: "T",
    S: "S",
    L: "L",
    R: "R",
    K: "K",
    IH0: "#",
    D: "D",
    M: "M",
    Z: "Z",
    P: "P",
    ER0: "$",
    IY0: "&",
    EH1: "<",
    B: "B",
    AE1: ">",
    IH1: "@",
    AA1: "0",
    F: "F",
    NG: "n",
    V: "V",
    EY1: "1",
    G: "G",
    SH: "s",
    IY1: "2",
    W: "W",
    AO1: "3",
    AH1: "4",
    OW1: "5",
    AY1: "6",
    JH: "J",
    HH: "H",
    UW1: "7",
    Y: "Y",
    CH: "C",
    ER1: "8",
    EY2: "9",
    OW0: "A",
    AY2: "E",
    EH2: "I",
    IH2: "O",
    AE2: "Q",
    TH: "t",
    AA2: "U",
    AW1: "X",
    OW2: "a",
    EH0: "b",
    AA0: "c",
    IY2: "e",
    UW0: "f",
    AO2: "g",
    AE0: "h",
    UH1: "i",
    AH2: "j",
    UW2: "k",
    AY0: "l",
    OY1: "m",
    AO0: "o",
    ZH: "z",
    AW2: "p",
    DH: "d",
    EY0: "q",
    ER2: "r",
    UH2: "u",
    OY2: "v",
    UH0: "w",
    AW0: "x",
    OY0: "y",
  };
  let asciibet = "";
  // Split the pronunciation string into individual phonemes
  let phonemes = pronunciation.split(" ");
  // Convert each phoneme to its ASCIIBET equivalent
  for (let phoneme of phonemes) {
    if (phones[phoneme]) {
      asciibet += phones[phoneme];
    } else {
      asciibet += phoneme;
    }
  }
  return asciibet;
}

function editDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  let matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[len1][len2];
}

// function to update the score and display it
function updateScore(points) {
  score += points;
  scoreDisplay.textContent = score;
}

// function to update the previous guesses display

function updatePreviousGuesses(guess) {
  const guessElement = document.createElement("span");
  guessElement.textContent = guess;
  // insert at the beginning of the list
  previousGuessesDisplay.insertBefore(
    guessElement,
    previousGuessesDisplay.firstChild
  );
}

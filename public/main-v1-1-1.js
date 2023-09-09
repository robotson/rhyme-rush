const initialState = document.getElementById("initial-state");
const endState = document.getElementById("end-state");
const modal = document.getElementById("instruction-modal");
const challengeModal = document.getElementById("challenge-modal");
const challengeFriendButton = document.getElementById("challenge-button");
const closeChallengeModalButton = document.getElementById(
  "close-challenge-modal"
);
const nav = document.getElementById("nav");
const howToButton = document.getElementById("how-to-play");
const modalCloseButton = document.getElementsByClassName("close-button")[0];
const modalBottomDoneButton = document.getElementById("modal-bottom-done");
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
const finalTargetDisplay = document.getElementById("final-target");
const challengeLinkInput = document.getElementById("challenge-link");
const challengeMessage = document.getElementById("challenge-message");
const copyChallengeLinkButton = document.getElementById("copy-challenge-link");
const copyChallengeMessageButton = document.getElementById(
  "copy-challenge-message"
);
const NUM_SECONDS = 1;
// convert num seconds into initial time display
const INITIAL_TIME_DISPLAY = `${Math.floor((NUM_SECONDS + 1) / 60)}:${
  (NUM_SECONDS + 1) % 60 < 10 ? "0" : ""
}${(NUM_SECONDS + 1) % 60}`;
``;
const baseURL = window.location.origin;
// array of starter words
let starterWords = ["RHYME", "TIME", "RUSH", "CRUSH"];
let isChallengeMode = false;
let dictionary = {};
let dictionaryLoaded = false;
let targetWord = "";
let targetPronunciation = "";
let targetASCIIBET = "";
let challengeLink = `${baseURL}/challenge/`;
let maxEditDistance = 0;
let statusTimeoutID;
let countdownInterval;
let score = 0;
let timer;
let timeLeft = NUM_SECONDS; // 2 minutes in seconds minus 1 for the delay in loading
const badGuesses = new Set();
const strongGuesses = new Set();
const weakGuesses = new Set();
const finalGuesses = [];
loadDictionary();
loadStarterWords();

async function loadDictionary() {
  try {
    const response = await fetch("./dictionary.json");
    dictionary = await response.json();
    dictionaryLoaded = true;
    handleChallengeWord();
  } catch (error) {
    console.error("Error loading dictionaries:", error);
    alert("Error loading dictionaries. Please try refreshing the page.");
  }
}

async function loadStarterWords() {
  try {
    const response = await fetch("./level_1_words.json");
    starterWords = await response.json();
  } catch (error) {
    console.error("Error loading starter words:", error);
    alert("Error loading starter words. Please try refreshing the page.");
  }
}

// function to check if the user is in challenge mode
// we check the url for a base64 encoded word
// if it's there, we decode it and set the target word to that word
// and set the challenge mode flag to true
function handleChallengeWord() {
  const pathArray = window.location.pathname.split("/");
  if (pathArray.length > 2 && pathArray[1] === "challenge") {
    const base64Word = pathArray[2];
    const decodedWord = atob(base64Word);
    // use our helper funcs to normalize and verify the word
    const normalizedWord = normalize(decodedWord);
    if (pronunciationExists(normalizedWord)) {
      targetWord = normalizedWord;
      isChallengeMode = true;
    } else {
      // if the word is not in the dictionary, we need to notify
      // the user that the challenge link is invalid, and send them back to the home page
      // TODO: add a message to the home page that the challenge link is invalid
    }
  }
}

function startCountdown() {
  // HACK TO GET AROUND MOBILE KEYBOARD ISSUE on IOS
  const dumb = document.createElement("input");
  dumb.setAttribute("type", "text");
  dumb.setAttribute("enterkeyhint", "go");
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

  nav.style.color = "white";

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
      textInput.blur();
      endGame();
    }

    timeLeft--;
  }, 1000);
}
function startGame() {
  // hide the countdown and show the playing state
  initialState.classList.add("hidden");
  playingState.classList.remove("hidden");
  // start the timer
  document.getElementById("timer").textContent = INITIAL_TIME_DISPLAY;
  startTimer();

  // we have a routine for setting the target word
  // either we're in challenge mode and the target word is set
  // or we're in normal mode and we need to set the target word
  if (!isChallengeMode) {
    // get a random word from the starter words array
    targetWord = starterWords[Math.floor(Math.random() * starterWords.length)];
    // normalize the word
    // targetWord = "rhyme";
    targetWord = normalize(targetWord);
    // make sure it's in the dictionary
    while (!pronunciationExists(targetWord)) {
      targetWord =
        starterWords[Math.floor(Math.random() * starterWords.length)];
      targetWord = normalize(targetWord);
    }
  }
  wordDisplay.textContent = targetWord;
  // most common pronunciation is the first one
  targetPronunciation = dictionary[targetWord][0];
  targetASCIIBET = convertToASCIIBET(targetPronunciation);
  maxEditDistance = targetASCIIBET.length;
}

// called when the timer runs out
function endGame() {
  playingState.classList.add("hidden");
  endState.classList.remove("hidden");
  finalScore.textContent = score;
  // sort the final guesses array  into categories, perfect, near, off, slant
  // and then sort each category alphabetically by word
  const alphaSort = (a, b) => {
    if (a.word < b.word) return -1;
    if (a.word > b.word) return 1;
    return 0;
  };

  // lets sort by points as well
  const pointsSort = (a, b) => {
    if (a.points > b.points) return -1;
    if (a.points < b.points) return 1;
    return 0;
  };
  const perfectGuesses = finalGuesses.filter(
    (guess) => guess.category === "perfect"
  );
  perfectGuesses.sort(pointsSort);

  const offGuesses = finalGuesses.filter((guess) => guess.category === "off");
  offGuesses.sort(pointsSort);

  const slantGuesses = finalGuesses.filter(
    (guess) => guess.category === "slant"
  );
  slantGuesses.sort(pointsSort);

  const nearGuesses = finalGuesses.filter((guess) => guess.category === "near");
  nearGuesses.sort(pointsSort);

  // display the final guesses
  // build a bulky html string to put in the DOM
  finalTargetDisplay.textContent = `Target word: ${targetWord}`;
  let html = "";
  const guessCategories = [
    {
      name: "Perfect Rhymes",
      guesses: perfectGuesses,
      className: "perfect-final",
    },
    { name: "Off Rhymes", guesses: offGuesses, className: "off-final" },
    { name: "Slant Rhymes", guesses: slantGuesses, className: "slant-final" },
    { name: "Near Rhymes", guesses: nearGuesses, className: "near-final" },
  ];
  for (const category of guessCategories) {
    if (category.guesses.length > 0) {
      html += `<div class="final-category ${category.className}">`;
      html += `<h3>${category.name}</h3>`;
      html += "<ul>";
      for (const guess of category.guesses) {
        html += `<li>${guess.word} - ${guess.points} pts</li>`;
      }
      html += "</ul></div>";
    }
  }
  document.getElementById("final-words").innerHTML = html;

  // update the challenge link
  document.getElementById(
    "challenge-paragraph"
  ).textContent = `This link loads Rhyme Rush with the target word you just played: "${targetWord}".`;
  challengeLink += btoa(targetWord);
  challengeLinkInput.value = challengeLink;
  challengeMessage.value = `I got ${score} points in Rhyme Rush! Can you beat my score? ${challengeLink}`;
}

// EVENT LISTENERS

window.onpopstate = function (event) {
  if (window.location.pathname === "/") {
    // Go back to the initial game state
    resetGameState();
  } else if (window.location.pathname.startsWith("/challenge/")) {
    // Parse the challenge ID and go to that state
    resetGameState();
    handleChallengeWord();
  }
};

howToButton.addEventListener("click", function () {
  modal.style.display = "block";
});
modalCloseButton.addEventListener("click", function () {
  modal.style.display = "none";
});
modalBottomDoneButton.addEventListener("click", function () {
  modal.style.display = "none";
});

function closeModalIfClickedOutside(event) {
  if (event.target == modal) {
    modal.style.display = "none";
    return;
  }
  if (event.target == challengeModal) {
    challengeModal.style.display = "none";
    return;
  }
}
// Open the Challenge link modal
challengeFriendButton.addEventListener("click", () => {
  challengeModal.style.display = "block";
});

// Close the Challenge link modal
closeChallengeModalButton.addEventListener("click", () => {
  challengeModal.style.display = "none";
});

// helper for copying the challenge message to the clipboard
async function copyContent(element) {
  try {
    await navigator.clipboard.writeText(element.value);
    return true;
  } catch (err) {
    console.error("Failed to copy: ", err);
    return false;
  }
}
// helper for changing the button text to "Copied!" for 3 seconds and then back to the original text
function changeButtonText(button) {
  const originalText = button.textContent;
  button.textContent = "Copied!";
  setTimeout(() => {
    button.textContent = originalText;
  }, 3000);
}

// Copy the challenge link to the clipboard
copyChallengeLinkButton.addEventListener("click", () => {
  const copied = copyContent(challengeLinkInput);
  if (copied) {
    changeButtonText(copyChallengeLinkButton);
  }
});

// Copy the challenge message to the clipboard
copyChallengeMessageButton.addEventListener("click", () => {
  const copied = copyContent(challengeMessage);
  if (copied) {
    changeButtonText(copyChallengeMessageButton);
  }
});

// Listen for clicks (desktop) and for taps (mobile) outside modals
window.addEventListener("click", closeModalIfClickedOutside);
window.addEventListener("touchstart", closeModalIfClickedOutside);

// Listen for the start button to be clicked
startButton.addEventListener("click", startCountdown);
// Listen for the restart button to be clicked
restartButton.addEventListener("click", resetGameState);

// Listen for form submit
wordForm.addEventListener("submit", function (event) {
  event.preventDefault();
  // Get the user input and normalize it
  const userInput = normalize(textInput.value);
  // prevent them from submitting an empty string
  if (userInput === "") return;
  // prevent submitting the same word as the target word
  if (userInput === targetWord) {
    updateStatusMessage("You can't rhyme with the target word!");
    textInput.value = "";
    return;
  }

  if (pronunciationExists(userInput)) {
    // see if the user has already guessed this word
    if (strongGuesses.has(userInput)) {
      updateStatusMessage(`Already found "${userInput}"`);
    } else if (weakGuesses.has(userInput)) {
      updateStatusMessage(`"${userInput}" already guessed`);
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
  } else if (isOffRhyme(testPronunciation, targetPronunciation)) {
    // points for an offrhyme will be almost as much as a perfect rhyme, lets say, base score of 7
    // plus a bonus for the edit distance
    // we should be garunteed to have edit distance of at least 1 because we've already checked for perfect rhymes
    // so we'll add 1 to the edit distance to avoid dividing by 0
    if (testDistance === 0) {
      testDistance = 1;
    }
    let points = 7;
    const bonusPoints = Math.ceil(7 / testDistance);

    // update status message to show off rhyme, 7 points plus bonus points
    updateStatusMessage(`Off rhyme! +7 points +${bonusPoints} phonetic bonus`);
    // update the score
    updateScore(7 + bonusPoints);
    points += bonusPoints;
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
      category: "off",
    });
  } else if (isSlantRhyme(testPronunciation, targetPronunciation)) {
    // we'll score slant rhymes similarly, but give them a base score of 5 points. otherwise
    // the process is the same as off rhymes
    if (testDistance === 0) {
      testDistance = 1;
    }
    let points = 5;
    const bonusPoints = Math.ceil(5 / testDistance);

    // update status message to show off rhyme, 5 points plus bonus points
    updateStatusMessage(
      `Slant rhyme! +5 points +${bonusPoints} phonetic bonus`
    );
    // update the score
    updateScore(5 + bonusPoints);
    points += bonusPoints;
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
      category: "slant",
    });
  } else {
    // we want to express a relationship
    // between edit distances, a "near rhyme" for our purposes
    // shall be defined as a word that is not a perfect rhyme
    // or and off rhyme or a slant rhyme, but is within a certain
    // edit distance of the target word, proportional to the maximum edit distance
    // allowed for the target word. (ie: if you didn't have to change more than 50% of the sounds)
    // then it's a near rhyme
    const threshold = Math.ceil(maxEditDistance / 2);
    if (testDistance <= threshold) {
      // it's a near rhyme so we add it to strong guesses, update the score, and update the display
      // and add it to the final guesses array
      // we'll calculate the points as the inverse of the edit distance
      if (testDistance === 0) {
        testDistance = 1;
      }
      const points = Math.ceil(3 / testDistance);
      strongGuesses.add(userInput);
      updateScore(points);
      updatePreviousGuesses(userInput);
      updateStatusMessage(`"${userInput}" is a near rhyme! +${points} points`);
      finalGuesses.push({
        word: userInput,
        pronunciation: testPronunciation,
        distance: testDistance,
        points: points,
        category: "near",
      });
    }
    // if it's not a near rhyme, we assume we've checked all the other rhyme categories
    // and we put it in the weak guesses set, update the status message
    else {
      weakGuesses.add(userInput);
      updateStatusMessage(`"${userInput}" is not a close enough rhyme match`);
    }
  }
}

// RHYME CHECKING FUNCTIONS
function isPerfectRhyme(testPronunciation, targetPronunciation) {
  // get the stressed part of the pronunciation
  const testStressed = getStressedRhymePart(testPronunciation);
  const targetStressed = getStressedRhymePart(targetPronunciation);
  return testStressed === targetStressed;
}
function isOffRhyme(testPronunciation, targetPronunciation) {
  // Helper function to generate a regular expression pattern for off-rhymes
  function generateOffRhymePattern(pronunciation) {
    let index = -1;
    const stresses = ["1", "2", "0"];
    for (const stress of stresses) {
      index = pronunciation.lastIndexOf(stress);
      if (index > -1) {
        break;
      }
    }

    let hyphenIndex = pronunciation.search("-");
    if (hyphenIndex !== -1 && hyphenIndex < index) {
      pronunciation = pronunciation.slice(hyphenIndex + 1);
      pronunciation = pronunciation.trim();
    }

    let pronParts = pronunciation.split(/(..[012] R|ER[012])/);
    pronParts = pronParts.map((part) =>
      part.replace(/(..[012] R|ER[012])/g, "!")
    );

    pronParts = pronParts.map((part) => part.replace(/..[012]/g, ".[^R][012]"));
    pronParts = pronParts.map((part) =>
      part.replace("!", "(..[012] R|ER[012])")
    );

    let pronWild = pronParts.join("");
    pronWild = pronWild + "$";

    return pronWild;
  }

  const testPattern = generateOffRhymePattern(testPronunciation);
  const targetPattern = generateOffRhymePattern(targetPronunciation);

  // Compare the two patterns
  return (
    new RegExp(testPattern).test(targetPronunciation) ||
    new RegExp(targetPattern).test(testPronunciation)
  );
}
function isSlantRhyme(testPronunciation, targetPronunciation) {
  // Helper function to generate a regular expression pattern for slant rhymes
  function generateSlantRhymePattern(pronunciation) {
    let index = pronunciation.search(/[012]/);

    const pronParts = pronunciation.split("-");

    let pronWild = pronParts
      .map((part) => {
        const vowelMatch = part.match(/..[012]/);
        if (!vowelMatch) return "";
        let vowel = vowelMatch[0];

        return (
          "(B|CH|D|DH|F|G|HH|JH|K|L|M|N|NG|P|R|S|SH|T|TH|V|W|Y|Z|ZH| )*" +
          vowel +
          "(B|CH|D|DH|F|G|HH|JH|K|L|M|N|NG|P|R|S|SH|T|TH|V|W|Y|Z|ZH| )*"
        );
      })
      .join("-");

    pronWild = pronWild + "$";

    return pronWild;
  }

  const testPattern = generateSlantRhymePattern(testPronunciation);
  const targetPattern = generateSlantRhymePattern(targetPronunciation);

  // Compare the two patterns
  return (
    new RegExp(testPattern).test(targetPronunciation) ||
    new RegExp(targetPattern).test(testPronunciation)
  );
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

/**
 * Reset all game state variables to their initial values.
 * If the game is in challenge mode, also reset the URL and challenge link.
 */
function resetGameState() {
  // If in challenge mode, reset URL and challenge link
  if (isChallengeMode) {
    // Reset the challenge link
    challengeLink = `${baseURL}/challenge/`;

    // Reset the challenge mode flag
    isChallengeMode = false;

    // Update the URL to the root
    window.history.pushState({}, "", "/");
  }

  // Reset game counters and scores
  score = 0;
  timeLeft = NUM_SECONDS;

  // Reset UI elements
  nav.style.color = "black";
  document.getElementById("timer").textContent = INITIAL_TIME_DISPLAY;
  document.getElementById("countdown-number").textContent = "3";
  textInput.value = "";
  statusDisplay.textContent = "";
  scoreDisplay.textContent = score;
  previousGuessesDisplay.innerHTML = "";
  previousGuessesDisplay.classList.add("transparent");
  document.getElementById("final-words").innerHTML = "";

  // Reset game state variables
  badGuesses.clear();
  strongGuesses.clear();
  weakGuesses.clear();
  finalGuesses.length = 0;
  targetASCIIBET = "";
  targetPronunciation = "";
  finalTargetDisplay.textContent = "";
  targetWord = "";
  maxEditDistance = 0;

  // Clear any existing intervals
  clearInterval(timer);
  clearInterval(countdownInterval);

  // Reset visibility of game sections
  endState.classList.add("hidden");
  initialState.classList.remove("hidden");
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
  if (previousGuessesDisplay.childElementCount === 0) {
    previousGuessesDisplay.classList.remove("transparent");
  }

  const guessElement = document.createElement("span");
  guessElement.textContent = guess;
  // insert at the beginning of the list
  previousGuessesDisplay.insertBefore(
    guessElement,
    previousGuessesDisplay.firstChild
  );
}

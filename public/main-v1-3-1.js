// GLOBALS
// GLOBAL CONSTANTS
const COUNTDOWN_DURATION = 3; // 3 counts
const CIRCLE_TRANSITION_DURATION = 400;
const COUNTDOWN_INTERVAL = 800; // 800 ms
const INITIAL_TIMER_VALUE = 89; // 89 seconds
const OFF_BLACK = "#1d1b1b";
const ASCIIBET_PHONES = {
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
// GLOBAL ELEMENTS FOR DOM CONVENIENCE
const RHYME_GOES_HERE_BOX = document.getElementById("rhyme-goes-here-box");
const STATUS_CONTAINER = document.getElementById("status-container");

document.documentElement.style.setProperty(
  "--doc-height",
  `${window.innerHeight}px`
);

// NAMESPACE FOR GLOBAL VARIABLES
const RHYME_RUSH_GLOBALS = {
  dictLoaded: false,
  isChallengeMode: false,
  clock_seconds: INITIAL_TIMER_VALUE,
  timer_interval: null,
  countdownInterval: null,
  currentMessageTimeout: null,
  targetWord: "",
  targetPronunciation: "",
  targetASCIIBET: "",
  maxEditDistance: 0,
  score: 0,
  badGuesses: new Set(),
  strongGuesses: new Set(),
  weakGuesses: new Set(),
  finalGuesses: [],
};

let statusTimeoutID;

// default game data --------------------------------------------------
let STARTER_WORDS = ["RHYME", "TIME", "RUSH", "CRUSH"];
let BIG_DICT = {};
let STATUS_DURATION, STATUS_TRANSITION;
// pulling these values from CSS but sometimes they don't load in time
// guess i could just wrap in a domcontentloaded event listener
document.addEventListener("DOMContentLoaded", function () {
  STATUS_DURATION =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--status-duration"
      )
    ) || 2000;
  STATUS_TRANSITION =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--status-transition"
      )
    ) || 200;
});

// functions for loading dictionary and starter words -----------------
async function loadDictionary() {
  try {
    const response = await fetch("./dictionary.json");
    BIG_DICT = await response.json();
    RHYME_RUSH_GLOBALS.dictLoaded = true;
    handleChallengeWord();
  } catch (error) {
    console.error("Error loading dictionaries:", error);
    alert("Error loading dictionaries. Please try refreshing the page.");
  }
}
loadDictionary();
async function loadStarterWords() {
  try {
    const response = await fetch("./level_1_words.json");
    STARTER_WORDS = await response.json();
  } catch (error) {
    console.error("Error loading starter words:", error);
    alert("Error loading starter words. Please try refreshing the page.");
  }
}
loadStarterWords();

// EVENT LISTENERS -----------------------------------------------------------
// Listen for the start button to be clicked
document
  .getElementById("get-this-party-started-button")
  .addEventListener("click", startCountdown);
// form submit event listener
document
  .getElementById("so-you-think-you-can-rhyme-form")
  .addEventListener("submit", submitWord);

// Listen for the restart button to be clicked
document.getElementById("restart-button").addEventListener("click", resetGame);

// Listen for how to play button to be clicked
document.getElementById("how-to-play").addEventListener("click", function () {
  document.getElementById("instruction-modal").style.display = "block";
  // check if the user is on a mobile device
  if (window.innerWidth < 768) {
    // show the done button
    document.getElementById("modal-bottom-done").classList.remove("hidden");
  } else {
    // hide the done button
    document.getElementById("modal-bottom-done").classList.add("hidden");
  }
});

// Instruction Modal close button
document
  .querySelector("#instruction-modal .close-button")
  .addEventListener("click", function () {
    document.getElementById("instruction-modal").style.display = "none";
  });
// Instruction Modal Done button
document
  .getElementById("modal-bottom-done")
  .addEventListener("click", function () {
    document.getElementById("instruction-modal").style.display = "none";
  });

// Challenge a Friend Button
document.getElementById("challenge-button").addEventListener("click", () => {
  document.getElementById("challenge-modal").style.display = "block";
});

// Challenge Modal close button
document
  .getElementById("close-challenge-modal")
  .addEventListener("click", () => {
    document.getElementById("challenge-modal").style.display = "none";
  });

// Listen for clicks (desktop) and for taps (mobile) outside modals
function closeModalIfClickedOutside(event) {
  const modal = document.getElementById("instruction-modal");
  const challengeModal = document.getElementById("challenge-modal");
  if (event.target == modal) {
    modal.style.display = "none";
    return;
  }
  if (event.target == challengeModal) {
    challengeModal.style.display = "none";
    return;
  }
}
window.addEventListener("click", closeModalIfClickedOutside);
window.addEventListener("touchstart", closeModalIfClickedOutside);

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

// Copy the challenge message to the clipboard
document
  .getElementById("copy-challenge-message")
  .addEventListener("click", () => {
    const copied = copyContent(document.getElementById("challenge-message"));
    if (copied) {
      changeButtonText(document.getElementById("copy-challenge-message"));
    }
  });

// lets create some handlers that add and then remove an "active" state when a button is touch tapped.
const buttons = document.querySelectorAll("button");
// iterate through the buttons and add the event listeners
for (const button of buttons) {
  button.addEventListener("touchstart", function () {
    this.classList.add("active");
  });
  button.addEventListener("touchend", function () {
    this.classList.remove("active");
  });
  button.addEventListener("click", function () {
    this.classList.remove("active");
  });
}

// Start Countdown block ------------------------------------------------------
function setThemeColor(color) {
  let themeColorTag = document.querySelector("meta[name=theme-color]");

  if (!themeColorTag) {
    themeColorTag = document.createElement("meta");
    themeColorTag.setAttribute("name", "theme-color");
    document.getElementsByTagName("head")[0].appendChild(themeColorTag);
  }

  themeColorTag.setAttribute("content", color);
}
// Utility function to calculate maximum distance from click point to any corner of the viewport
function getMaxDistance(x, y) {
  const maxX = Math.max(x, window.innerWidth - x);
  const maxY = Math.max(y, window.innerHeight - y);
  return Math.sqrt(maxX ** 2 + maxY ** 2);
}

function startCountdown(event) {
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

  const countdownElement = document.getElementsByClassName("step-0")[0];
  const countdownScreen = document.getElementsByClassName("get-ready")[0];
  const initScreen = document.getElementsByClassName("init")[0];
  const nav = document.getElementsByClassName("nav")[0];

  fadeOverlayInAndOut(CIRCLE_TRANSITION_DURATION, "var(--off-black)", () => {
    // Hide the init screen

    initScreen.classList.add("hidden");
    countdownScreen.classList.remove("hidden");
    document.body.style.backgroundColor = "var(--rhyme-rush-red)";

    nav.classList.remove("hidden");
    setThemeColor(OFF_BLACK);

    // countdownElement.classList.remove("transparent");
    countdownElement.classList.add("fade-in-scale");
  });

  nav.style.opacity = 1;
  let countdownNumber = COUNTDOWN_DURATION;

  let index = 0;
  RHYME_RUSH_GLOBALS.countdownInterval = setInterval(function () {
    if (countdownNumber <= 0) {
      clearInterval(RHYME_RUSH_GLOBALS.countdownInterval);
      startGame(); // Assuming startGame is a function you've defined elsewhere
      setTimeout(() => {
        document.getElementById("rhyme-goes-here-box").focus();
        dumb.remove();

        const step0 = document.getElementsByClassName("step-0")[0];
        const step1 = document.getElementsByClassName("step-1")[0];
        const step2 = document.getElementsByClassName("step-2")[0];
        const step3 = document.getElementsByClassName("step-3")[0];

        step0.classList.remove("fade-in-scale");
        step0.classList.remove("hidden");
        step1.classList.replace("fade-in-scale", "transparent");
        step2.classList.replace("fade-in-scale", "transparent");
        step3.classList.replace("fade-in-scale", "transparent");
        step3.classList.add("hidden");

        // step0.classList.remove
      }, CIRCLE_TRANSITION_DURATION / 2 + 10); // You can adjust the delay if necessary
    } else {
      const element = document.getElementsByClassName(`step-${index}`)[0];
      element.classList.add("hidden");
      const nextElement = document.getElementsByClassName(
        `step-${index + 1}`
      )[0];
      nextElement.classList.remove("hidden");
      nextElement.classList.remove("transparent");
      nextElement.classList.add("fade-in-scale");
      index++;
      countdownNumber--;
    }
  }, COUNTDOWN_INTERVAL);
}

// -- End Countdown block -----------------------------------------------------

// we need a new random number generator based on if browser supports crypto
// it should take in a min and max value and return a random number between them
// if crypto is not supported, we'll use Math.random()
function getRandomNumber(min, max) {
  if (window.crypto) {
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    const randomNumber = randomBuffer[0] / (0xffffffff + 1);
    return Math.floor(randomNumber * (max - min + 1)) + min;
  } else {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// Start "PLAYING GAME" block -----------------------------------------------------------
function startGame() {
  // analytics event
  gtag("event", "game_start", {
    event_category: "game",
    event_label: "Game Started",
    value: RHYME_RUSH_GLOBALS.isChallengeMode ? "challenge" : "normal",
  });

  const gameScreen = document.getElementsByClassName("game")[0];
  const countdownScreen = document.getElementsByClassName("get-ready")[0];
  const nav = document.getElementsByClassName("nav")[0];
  nav.style.color = "var(--off-white)";
  fadeOverlayInAndOut(
    CIRCLE_TRANSITION_DURATION / 2,
    "var(--off-black)",
    () => {
      countdownScreen.classList.add("hidden");
      gameScreen.classList.remove("hidden");
      document.body.style.backgroundColor = "var(--found-rhymes-grey)";
    }
  );

  // Start the timer
  startTimer();

  if (!RHYME_RUSH_GLOBALS.isChallengeMode) {
    // get a random word from the starter words array
    const candidateWord =
      STARTER_WORDS[getRandomNumber(0, STARTER_WORDS.length - 1)];
    RHYME_RUSH_GLOBALS.targetWord = normalize(candidateWord);
    // make sure it's in the dictionary
    while (!pronunciationExists(RHYME_RUSH_GLOBALS.targetWord)) {
      RHYME_RUSH_GLOBALS.targetWord =
        STARTER_WORDS[getRandomNumber(0, STARTER_WORDS.length - 1)];
      RHYME_RUSH_GLOBALS.targetWord = normalize(RHYME_RUSH_GLOBALS.targetWord);
    }
  }
  // update the word display
  document.getElementsByClassName("target-word")[0].textContent =
    RHYME_RUSH_GLOBALS.targetWord;
  // most common pronunciation is the first one
  RHYME_RUSH_GLOBALS.targetPronunciation =
    BIG_DICT[RHYME_RUSH_GLOBALS.targetWord][0];
  // convert the pronunciation to ASCIIBET
  RHYME_RUSH_GLOBALS.targetASCIIBET = convertToASCIIBET(
    RHYME_RUSH_GLOBALS.targetPronunciation,
    ASCIIBET_PHONES
  );
  // set the max edit distance
  RHYME_RUSH_GLOBALS.maxEditDistance = RHYME_RUSH_GLOBALS.targetASCIIBET.length;
}
// helper for keeping track of the timer
function startTimer() {
  RHYME_RUSH_GLOBALS.timer_interval = setInterval(function () {
    updateNumberPanel(
      RHYME_RUSH_GLOBALS.clock_seconds,
      "timer-number-container"
    );
    if (RHYME_RUSH_GLOBALS.clock_seconds <= 0) {
      clearInterval(RHYME_RUSH_GLOBALS.timer_interval);
      RHYME_GOES_HERE_BOX.blur();
      endGame();
    }
    RHYME_RUSH_GLOBALS.clock_seconds--;
  }, 1000);
}
// -- End "PLAYING GAME" block ----------------------------------------------------

// Start "GAME OVER" block -------------------------------------------------------------
function endGame() {
  // analytics event
  gtag("event", "game_end", {
    event_category: "game",
    event_label: "Game Ended",
    value: RHYME_RUSH_GLOBALS.score,
  });
  // document.getElementById("overlay").style.zIndex = 999;

  fadeOverlayInAndOut(
    CIRCLE_TRANSITION_DURATION / 3,
    "var(--off-black)",
    () => {
      document.querySelector(".game").classList.add("hidden");
      document.querySelector(".end").classList.remove("hidden");
      document.body.style.backgroundColor = "var(--found-rhymes-grey)";
    }
  );
  // document.getElementById("overlay").style.zIndex = 9999;
  // hide the game screen and show the end screen

  // update the score display
  document.getElementById("final-score").textContent = RHYME_RUSH_GLOBALS.score;

  document.getElementById("end-screen-target-word-display").textContent =
    RHYME_RUSH_GLOBALS.targetWord;

  sortFoundRhymes();

  // update the display of found rhymes

  // get each category of rhyme's container
  const perfectRhymesContainer = document.querySelector(
    ".perfect-rhymes .rhymes-list"
  );
  const offRhymesContainer = document.querySelector(".off-rhymes .rhymes-list");
  const slantRhymesContainer = document.querySelector(
    ".slant-rhymes .rhymes-list"
  );
  const nearRhymesContainer = document.querySelector(
    ".near-rhymes .rhymes-list"
  );

  // iterate through the final guesses array and add each word to the appropriate container
  for (const guess of RHYME_RUSH_GLOBALS.finalGuesses) {
    const rhymeItem = createRhymeListItem(guess.word, guess.points);
    switch (guess.category) {
      case "perfect":
        perfectRhymesContainer.appendChild(rhymeItem);
        break;
      case "off":
        offRhymesContainer.appendChild(rhymeItem);
        break;
      case "slant":
        slantRhymesContainer.appendChild(rhymeItem);
        break;
      case "near":
        nearRhymesContainer.appendChild(rhymeItem);
        break;
    }
  }
  // for any of the categories that are populated, show the container
  if (perfectRhymesContainer.children.length > 0) {
    perfectRhymesContainer.parentElement.classList.remove("hidden");
  }
  if (offRhymesContainer.children.length > 0) {
    offRhymesContainer.parentElement.classList.remove("hidden");
  }
  if (slantRhymesContainer.children.length > 0) {
    slantRhymesContainer.parentElement.classList.remove("hidden");
  }
  if (nearRhymesContainer.children.length > 0) {
    nearRhymesContainer.parentElement.classList.remove("hidden");
  }

  // create the challenge link
  const link = `${window.location.origin}/challenge/${btoa(
    RHYME_RUSH_GLOBALS.targetWord
  )}`;

  // get the hidden input element for the link and set its value
  document.getElementById("challenge-link").value = link;

  // build challenge message
  const message = `I scored ${RHYME_RUSH_GLOBALS.score} points in Rhyme Rush! Can you beat my score? ${link}`;

  // set the textarea value
  document.getElementById("challenge-message").value = message;
}
function sortFoundRhymes() {
  // sort the found rhymes by score
  RHYME_RUSH_GLOBALS.finalGuesses.sort((a, b) => {
    if (a.points > b.points) return -1;
    if (a.points < b.points) return 1;
    return 0;
  });
}

// reset all the game state variables and views
function resetGame() {
  if (RHYME_RUSH_GLOBALS.isChallengeMode) {
    // Reset the challenge mode flag
    RHYME_RUSH_GLOBALS.isChallengeMode = false;
    // Update the URL to the root
    window.history.pushState({}, "", "/");
  }

  // clear the timer interval
  clearInterval(RHYME_RUSH_GLOBALS.timer_interval);
  // clear the countdown interval
  clearInterval(RHYME_RUSH_GLOBALS.countdownInterval);
  // clear the current message timeout
  clearTimeout(RHYME_RUSH_GLOBALS.currentMessageTimeout);
  // null these out
  RHYME_RUSH_GLOBALS.timer_interval = null;
  RHYME_RUSH_GLOBALS.countdownInterval = null;
  RHYME_RUSH_GLOBALS.currentMessageTimeout = null;

  // reset the clock seconds
  RHYME_RUSH_GLOBALS.clock_seconds = INITIAL_TIMER_VALUE;

  // clear the target word
  RHYME_RUSH_GLOBALS.targetWord = "";
  // clear the target pronunciation
  RHYME_RUSH_GLOBALS.targetPronunciation = "";
  // clear the target ASCIIBET
  RHYME_RUSH_GLOBALS.targetASCIIBET = "";
  // clear the max edit distance
  RHYME_RUSH_GLOBALS.maxEditDistance = 0;
  // clear the score
  RHYME_RUSH_GLOBALS.score = 0;
  // clear the bad guesses set
  RHYME_RUSH_GLOBALS.badGuesses.clear();
  // clear the strong guesses set
  RHYME_RUSH_GLOBALS.strongGuesses.clear();
  // clear the weak guesses set
  RHYME_RUSH_GLOBALS.weakGuesses.clear();
  // clear the final guesses array
  RHYME_RUSH_GLOBALS.finalGuesses.length = 0;

  fadeOverlayInAndOut(CIRCLE_TRANSITION_DURATION, "var(--off-white)", () => {
    // hide the end screen and show the initial screen
    document.querySelector(".end").classList.add("hidden");
    document.querySelector(".init").classList.remove("hidden");
    // hide the nav
    document.querySelector(".nav").classList.add("hidden");
    // reset the theme color
    setThemeColor("var(--off-white)");
    // reset the background color
    document.body.style.backgroundColor = "var(--off-white)";
  });

  // reset the UI

  // reset the nav color
  document.querySelector(".nav").style.color = "var(--rhyme-rush-red)";

  // reset the target word display
  document.querySelector(".target-word").textContent = "";

  // reset the text entry box
  RHYME_GOES_HERE_BOX.value = "";

  // use panel display utility function to reset the timer and score displays
  updateNumberPanel(INITIAL_TIMER_VALUE, "timer-number-container");
  updateNumberPanel(0, "score-number-container");

  // clear each of the rhyme categories
  const rhymeListContainer = document.querySelector(".rhymes-list-container");
  const rhymeCategories = rhymeListContainer.children;
  for (const category of rhymeCategories) {
    category.classList.add("hidden");
    const rhymeList = category.querySelector(".rhymes-list");

    rhymeList.innerHTML = "";
  }
  // reset the end screen target word and score (even though we overwrite them later anyway)
  document.getElementById("end-screen-target-word-display").textContent = "";
  document.getElementById("final-score").textContent = "0";

  // reset the found rhymes display
  document.getElementById("found-rhymes-min").innerHTML = "";
  // reset the hidden status of the found rhymes container
  document.querySelector(".found-rhymes-wrapper").classList.add("hidden");

  // reset the hidden status and color of challenge warning and challenge notice
  document.getElementById("challenge-is-bad").classList.add("hidden");
  document.getElementById("challenge-is-good").classList.add("hidden");
  document.getElementById("challenge-is-bad").style.color = "var(--off-white)";
  document.getElementById("challenge-is-good").style.color = "var(--off-white)";
}

// -- End "GAME OVER" block -----------------------------------------------------

// Playing game stuff ---------------------------------------------------------
// Submit Word block ----------------------------------------------------------
function submitWord(event) {
  event.preventDefault();
  // Get the user input and normalize it
  const userInput = normalize(RHYME_GOES_HERE_BOX.value);
  // prevent them from submitting an empty string
  if (userInput === "") return;
  // prevent submitting the same word as the target word
  if (userInput === RHYME_RUSH_GLOBALS.targetWord) {
    updateStatusMessage("You can't rhyme with the target word!", "red-bg");
    RHYME_GOES_HERE_BOX.value = "";
    return;
  }

  if (pronunciationExists(userInput)) {
    // see if the user has already guessed this word
    if (RHYME_RUSH_GLOBALS.strongGuesses.has(userInput)) {
      updateStatusMessage(`Already matched "${userInput}"`, "red-bg");
    } else if (RHYME_RUSH_GLOBALS.weakGuesses.has(userInput)) {
      updateStatusMessage(`"${userInput}" already guessed`, "red-bg");
    } else {
      handleKnownPronunciation(userInput);
    }
  } else {
    // see if the user has already guessed this word
    if (RHYME_RUSH_GLOBALS.badGuesses.has(userInput)) {
      updateStatusMessage(
        `Already tried unknown word "${userInput}"`,
        "red-bg"
      );
    } else {
      // update status to show that the word is not in the dictionary
      updateStatusMessage(`"${userInput}" not found in dictionary`, "red-bg");
      // add the word to the bad guesses set
      RHYME_RUSH_GLOBALS.badGuesses.add(userInput);
    }
  }
  RHYME_GOES_HERE_BOX.value = "";
}

// RHYME SCORING UTILITY FUNCTIONS --------------------------------------------
function normalize(word) {
  // convert any smart quotes to straight quotes
  let sanitizedWord = word.replace(/[\u2018\u2019]/g, "'");
  // same for double quoets
  sanitizedWord = sanitizedWord.replace(/[\u201C\u201D]/g, '"');
  // remove all characters that aren't letters, numbers, spaces, or apostrophes
  sanitizedWord = sanitizedWord.replace(/[^a-zA-Z0-9\s']/g, "");
  // remove leading and trailing whitespace
  sanitizedWord = sanitizedWord.trim();
  // convert to uppercase
  sanitizedWord = sanitizedWord.toUpperCase();
  return sanitizedWord;
}
//check if pronunciation exists in dictionary
function pronunciationExists(word) {
  if (!RHYME_RUSH_GLOBALS.dictLoaded) return;
  if (BIG_DICT[word]) return true;
}
function convertToASCIIBET(pronunciation, phones) {
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

// function to handle guesses with a known pronunciation
function handleKnownPronunciation(userInput) {
  // we assume that we haven't already guessed this word
  // find the pronunciation that has the fewest edits from the user input
  const [testPronunciation, testDistance] = getClosestPronunciation(userInput);
  const quotedUserInput = `"${userInput}"`;
  // first we check to see if the pronunciation is a perfect rhyme
  if (
    isPerfectRhyme(testPronunciation, RHYME_RUSH_GLOBALS.targetPronunciation)
  ) {
    // calculate the score, add it to the total, and update the score display
    let points = 0;
    if (testDistance === 0) {
      // update status message because this is a "rich rhyme"
      updateStatusMessage(`Identical rhyme! +30`, "blue-bg", quotedUserInput);
      updateScore(30);
      points = 30;
    } else {
      // calculate bonus points for a perfect rhyme as the inverse of the edit distance
      const bonusPoints = Math.ceil(10 / testDistance);

      // update status message to show perfect rhyme, 10 points plus bonus points
      updateStatusMessage(
        `Perfect rhyme! +${10 + bonusPoints}`,
        "blue-bg",
        quotedUserInput
      );
      // update the score
      updateScore(10 + bonusPoints);
      points = 10 + bonusPoints;
    }
    // add the word to our strong guesses set
    RHYME_RUSH_GLOBALS.strongGuesses.add(userInput);
    // update the display of guesses
    updateFoundRhymes(userInput);
    // add the word and associated info to the final guesses array
    RHYME_RUSH_GLOBALS.finalGuesses.push({
      word: userInput,
      pronunciation: testPronunciation,
      distance: testDistance,
      points: points,
      category: "perfect",
    });
  } else if (
    isOffRhyme(testPronunciation, RHYME_RUSH_GLOBALS.targetPronunciation)
  ) {
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
    updateStatusMessage(
      `Off rhyme! +${7 + bonusPoints}`,
      "blue-bg",
      quotedUserInput
    );
    // update the score
    updateScore(7 + bonusPoints);
    points += bonusPoints;
    // add the word to our strong guesses set
    RHYME_RUSH_GLOBALS.strongGuesses.add(userInput);
    // update the display of guesses
    updateFoundRhymes(userInput);
    // add the word and associated info to the final guesses array
    RHYME_RUSH_GLOBALS.finalGuesses.push({
      word: userInput,
      pronunciation: testPronunciation,
      distance: testDistance,
      points: points,
      category: "off",
    });
  } else if (
    isSlantRhyme(testPronunciation, RHYME_RUSH_GLOBALS.targetPronunciation)
  ) {
    // we'll score slant rhymes similarly, but give them a base score of 5 points. otherwise
    // the process is the same as off rhymes
    if (testDistance === 0) {
      testDistance = 1;
    }
    let points = 5;
    const bonusPoints = Math.ceil(5 / testDistance);

    // update status message to show off rhyme, 5 points plus bonus points
    updateStatusMessage(
      `Slant rhyme! +${5 + bonusPoints}`,
      "blue-bg",
      quotedUserInput
    );
    // update the score
    updateScore(5 + bonusPoints);
    points += bonusPoints;
    // add the word to our strong guesses set
    RHYME_RUSH_GLOBALS.strongGuesses.add(userInput);
    // update the display of guesses
    updateFoundRhymes(userInput);
    // add the word and associated info to the final guesses array
    RHYME_RUSH_GLOBALS.finalGuesses.push({
      word: userInput,
      pronunciation: testPronunciation,
      distance: testDistance,
      points: points,
      category: "slant",
    });
  } else {
    // near rhymes are a little more complicated
    const threshold = Math.ceil(RHYME_RUSH_GLOBALS.maxEditDistance / 2);
    if (testDistance <= threshold) {
      if (testDistance === 0) {
        testDistance = 1;
      }
      const points = Math.ceil(3 / testDistance);
      RHYME_RUSH_GLOBALS.strongGuesses.add(userInput);
      updateScore(points);
      updateFoundRhymes(userInput);
      updateStatusMessage(`Near rhyme! +${points}`, "blue-bg", quotedUserInput);
      RHYME_RUSH_GLOBALS.finalGuesses.push({
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
      RHYME_RUSH_GLOBALS.weakGuesses.add(userInput);
      updateStatusMessage(
        `${quotedUserInput} is not a close enough match`,
        "red-bg"
      );
    }
  }
}
// function to get the closest pronunciation to the target pronunciation from multiple dictionary options for one spelling of a word
// return the closest pronunciation and the edit distance
function getClosestPronunciation(userInput) {
  // find the pronunciation that has the fewest edits from the user input
  // there might be only one pronunciation for a word
  let bestPronunciation = "";
  let bestDistance = Infinity;
  let testASCIIBET = "";
  if (BIG_DICT[userInput].length === 1) {
    bestPronunciation = BIG_DICT[userInput][0];
    testASCIIBET = convertToASCIIBET(bestPronunciation, ASCIIBET_PHONES);
    bestDistance = editDistance(
      RHYME_RUSH_GLOBALS.targetASCIIBET,
      testASCIIBET
    );
    return [bestPronunciation, bestDistance];
  }

  for (const pronunciation of BIG_DICT[userInput]) {
    testASCIIBET = convertToASCIIBET(pronunciation, ASCIIBET_PHONES);
    const distance = editDistance(
      RHYME_RUSH_GLOBALS.targetASCIIBET,
      testASCIIBET
    );
    if (distance < bestDistance) {
      bestDistance = distance;
      bestPronunciation = pronunciation;
    }
  }
  return [bestPronunciation, bestDistance];
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
// -- End Rhyme Scoring Utility Functions -------------------------------------
// RHYME FINDING FUNCTIONS AND HELPERS ----------------------------------------
/// Rhyme pattern matching functions
function isPerfectRhyme(testPronunciation, targetPronunciation) {
  // get the stressed part of the pronunciation
  const testStressed = getStressedRhymePart(testPronunciation);
  const targetStressed = getStressedRhymePart(targetPronunciation);
  return testStressed === targetStressed;
}
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
function isOffRhyme(testPronunciation, targetPronunciation) {
  const testPattern = generateOffRhymePattern(testPronunciation);
  const targetPattern = generateOffRhymePattern(targetPronunciation);
  // Compare the two patterns
  return (
    new RegExp(testPattern).test(targetPronunciation) ||
    new RegExp(targetPattern).test(testPronunciation)
  );
}
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
  pronParts = pronParts.map((part) => part.replace("!", "(..[012] R|ER[012])"));

  let pronWild = pronParts.join("");
  pronWild = pronWild + "$";

  return pronWild;
}
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
function isSlantRhyme(testPronunciation, targetPronunciation) {
  const testPattern = generateSlantRhymePattern(testPronunciation);
  const targetPattern = generateSlantRhymePattern(targetPronunciation);

  // Compare the two patterns
  return (
    new RegExp(testPattern).test(targetPronunciation) ||
    new RegExp(targetPattern).test(testPronunciation)
  );
}
// -- End Rhyme Finding Functions and Helpers ----------------------------------

// DISPLAY HELPER FUNCTIONS ---------------------------------------------------
// helper for updating the timer and score panels
function updateNumberPanel(number, panel) {
  // split timer into hundreds, tens, and ones
  const hundreds = Math.floor(number / 100);
  const tens = Math.floor((number - hundreds * 100) / 10);
  const ones = number - hundreds * 100 - tens * 10;
  // update the timer
  const numberContainer = document.getElementsByClassName(panel)[0];
  // each child of the timer number container represents a digit
  const hundredsDigit = numberContainer.children[0];
  const tensDigit = numberContainer.children[1];
  const onesDigit = numberContainer.children[2];
  hundredsDigit.textContent = hundreds;
  tensDigit.textContent = tens;
  onesDigit.textContent = ones;
}
// function to update the score and display it
function updateScore(points) {
  RHYME_RUSH_GLOBALS.score += points;
  updateNumberPanel(RHYME_RUSH_GLOBALS.score, "score-number-container");
}
function updateStatusMessage(topLine, type = "blue-bg", word = "") {
  // Remove any existing timeouts
  if (RHYME_RUSH_GLOBALS.currentMessageTimeout) {
    clearTimeout(RHYME_RUSH_GLOBALS.currentMessageTimeout);
  }
  // Get or create the message container element
  let statusMessage = document.querySelector(".status-message");
  if (statusMessage) {
    const existingMessage = statusMessage;
    existingMessage.classList.add("out");
    setTimeout(() => {
      existingMessage.remove();
    }, STATUS_TRANSITION); // should match the CSS transition time
  }
  statusMessage = document.createElement("div");
  statusMessage.className = `status-message ${type}`;

  statusMessage.appendChild(document.createTextNode(topLine));
  statusMessage.appendChild(document.createElement("br"));
  statusMessage.appendChild(document.createTextNode(word));
  STATUS_CONTAINER.appendChild(statusMessage);
  // // Trigger reflow to restart the CSS transition
  void statusMessage.offsetWidth;

  // Fade in the message
  statusMessage.classList.add("in");

  // Set a timeout to fade out and remove the message
  RHYME_RUSH_GLOBALS.currentMessageTimeout = setTimeout(() => {
    // Fade out the message
    statusMessage.classList.remove("in");
    statusMessage.classList.add("out");

    setTimeout(() => {
      statusMessage.remove();
    }, STATUS_TRANSITION); // should match the CSS transition time
  }, STATUS_DURATION); // Display each message for 3 secondsx
}

// function to update the display of found rhymes panel
function updateFoundRhymes(word) {
  const foundRhymesMin = document.getElementById("found-rhymes-min");

  // if this is the first word being added lets show the container
  if (foundRhymesMin.childElementCount === 0) {
    document.querySelector(".found-rhymes-wrapper").classList.remove("hidden");
  }
  // create a new element to display the word
  const wordElement = document.createElement("span");
  wordElement.textContent = word;

  // insert at the beginning of the list
  foundRhymesMin.insertBefore(wordElement, foundRhymesMin.firstChild);
  // Force a reflow (this makes the transition work)
  void wordElement.offsetWidth;

  // add width to this element the size of its number of characters in "ch" units
  wordElement.style.width = `${word.length}ch`;
  // Add the 'visible' class to trigger the transition
  wordElement.classList.add("visible");
}

// helper to create the dom elements for the rhyme list items
function createRhymeListItem(word, score) {
  const rhymeItem = document.createElement("div");
  rhymeItem.className = "rhyme-item";
  const wordElement = document.createElement("span");
  wordElement.className = "word";
  wordElement.textContent = word;
  const dotsElement = document.createElement("span");
  dotsElement.className = "dots";
  const scoreElement = document.createElement("span");
  scoreElement.className = "score";
  scoreElement.textContent = score;
  rhymeItem.appendChild(wordElement);
  rhymeItem.appendChild(dotsElement);
  rhymeItem.appendChild(scoreElement);
  return rhymeItem;
}

// -- End Display Helper Functions --------------------------------------------
function fadeOverlayInAndOut(duration = 500, color = "black", callback = null) {
  const overlay = document.getElementById("overlay");
  overlay.style.backgroundColor = color;
  overlay.style.transition = `opacity ${duration / 2}ms`;
  overlay.style.display = "block";

  // Fade in
  overlay.style.opacity = 1;

  // Wait for the fade-in to complete
  setTimeout(() => {
    // Execute the callback, if any. This is where you'd make your changes.
    if (callback) {
      callback();
    }

    // Fade out
    overlay.style.opacity = 0;

    // Remove overlay after fade-out complete
    setTimeout(() => {
      overlay.style.display = "none";
    }, duration / 2);
  }, duration / 2);
}

// CHALLENGE MODE STUFF -------------------------------------------------------
function handleChallengeWord() {
  const pathArray = window.location.pathname.split("/");
  if (pathArray.length > 2 && pathArray[1] === "challenge") {
    const base64Word = pathArray[2];

    // this can throw an error if the word is not a valid base64 string
    // so we wrap it in a try/catch
    try {
      const decodedWord = atob(base64Word);
      const normalizedWord = normalize(decodedWord);
      if (pronunciationExists(normalizedWord)) {
        RHYME_RUSH_GLOBALS.targetWord = normalizedWord;
        RHYME_RUSH_GLOBALS.isChallengeMode = true;
        // toggle the visibility of the welcome message and the start button
        document.getElementById("challenge-is-good").classList.remove("hidden");
        document.getElementById("challenge-is-good").style.color =
          "var(--off-black)";
      } else {
        // if the word is not in the dictionary, we need to notify
        // the user that the challenge link is invalid
        handleBadChallengeLink();
      }
    } catch (error) {
      handleBadChallengeLink();
    }
  }
}
function handleBadChallengeLink() {
  // When an invalid challenge link is accessed
  gtag("event", "invalid_challenge", {
    event_category: "error",
    event_label: "Invalid Challenge Link",
  });

  // toggle the visibility of the warning message and the start button
  document.getElementById("challenge-is-bad").classList.remove("hidden");
  document.getElementById("challenge-is-bad").style.color =
    "var(--rhyme-rush-red)";
  // update the url to remove the invalid word
  window.history.pushState({}, "", "/");
}

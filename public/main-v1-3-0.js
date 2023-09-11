// GLOBALS
// GLOBAL CONSTANTS
const COUNTDOWN_DURATION = 0;
const MOBILE_BREAKPOINT = 450;
const CIRCLE_TRANSITION_DURATION = 400;
const INITIAL_TIMER_VALUE = 89;
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

// GLOBAL VARIABLES
// variables for the game

let BIG_DICT = {};

// we should put the most commonly used global variables in an object that we namespace
const RHYME_RUSH_GLOBALS = {
  dictLoaded: false,
  isChallengeMode: false,
  clock_seconds: INITIAL_TIMER_VALUE,
  timer_interval: null,
  countdownInterval: null,
  targetWord: "",
  targetPronunciation: "",
  targetASCIIBET: "",
  badGuesses: new Set(),
  strongGuesses: new Set(),
  weakGuesses: new Set(),
  finalGuesses: [],
};

// default game data --------------------------------------------------
let STARTER_WORDS = ["RHYME", "TIME", "RUSH", "CRUSH"];

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

//-----------------------------------------------------------------------------
// fix document height on mobile browsers/ prevent resizing on pull-to-refresh
// Function to set the height
const VIEWPORT_HACK = {
  viewportHeight: window.innerHeight,
  lastScrollY: window.scrollY,
  isMobile: window.innerWidth <= MOBILE_BREAKPOINT, // Adjust 768 to your mobile breakpoint
};
const setViewportHeight = () => {
  document.documentElement.style.setProperty(
    "--doc-height",
    `${VIEWPORT_HACK.viewportHeight}px`
  );
};
// Function to determine if we should update the height
const shouldUpdateHeight = () => {
  // On mobile and not at the top of the viewport (not a pull-to-refresh)
  return (
    VIEWPORT_HACK.isMobile &&
    (window.scrollY > 1 || VIEWPORT_HACK.lastScrollY > 1)
  );
};
// Initial set
setViewportHeight();
// Listen for resize
window.addEventListener("resize", () => {
  VIEWPORT_HACK.isMobile = window.innerWidth <= MOBILE_BREAKPOINT; // Recheck if mobile
  if (!isMobile) {
    // On desktop, revert to normal behavior
    VIEWPORT_HACK.viewportHeight = window.innerHeight;
    setViewportHeight();
  } else if (shouldUpdateHeight()) {
    VIEWPORT_HACK.viewportHeight = window.innerHeight;
    setViewportHeight();
  }
});
// Listen for scroll
window.addEventListener("scroll", () => {
  VIEWPORT_HACK.lastScrollY = window.scrollY;
});

// -- End Fix doc height block ------------------------------------------------

// EVENT LISTENERS -----------------------------------------------------------
// Listen for the start button to be clicked
document
  .getElementById("get-this-party-started-button")
  .addEventListener("click", startCountdown);
document
  .getElementById("so-you-think-you-can-rhyme-form")
  .addEventListener("submit", submitWord);

// Start Countdown block ------------------------------------------------------
// startCountdown({ clientX: 280, clientY: 361 }); // start this just to get to this screen for now
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
  const countdownElement = document.getElementsByClassName("counter")[0];
  const countdownScreen = document.getElementsByClassName("get-ready")[0];
  const initScreen = document.getElementsByClassName("init")[0];
  const nav = document.getElementsByClassName("nav")[0];
  let countdownNumber = COUNTDOWN_DURATION;

  // set duration of transiton on css variable
  document.documentElement.style.setProperty(
    "--circle-transition-duration",
    `${CIRCLE_TRANSITION_DURATION}ms`
  );

  // routine to animate a transition from the start screen to the countdown screen
  const circle = document.getElementsByClassName("transition-circle")[0];
  // Retrieve coordinates where the click event occurred
  const x = event.clientX;
  const y = event.clientY;

  // Calculate the maximum distance the circle will need to cover
  const maxDistance = getMaxDistance(x, y);

  // Initially set the circle to emanate from the click point
  circle.style.left = `${x}px`;
  circle.style.top = `${y}px`;
  circle.style.width = "0px";
  circle.style.height = "0px";
  circle.style.opacity = "1";
  // circle.style.boxShadow = "0 0 25px 25px var(--rhyme-rush-red)";

  // force animation elements to happen in the right order
  requestAnimationFrame(() => {
    const circleDiameter = maxDistance * 2 - 25; // 25 is the box shadow
    circle.style.width = `${circleDiameter}px`;
    circle.style.height = `${circleDiameter}px`;
    circle.style.left = `${x - maxDistance}px`;
    circle.style.top = `${y - maxDistance}px`;
  });

  // Hide the initial screen and show the next screen after the animation
  setTimeout(() => {
    document.body.style.backgroundColor = "var(--rhyme-rush-red)";
    // set the theme color in the meta tag
    setThemeColor(OFF_BLACK);
    initScreen.classList.add("hidden");
    countdownScreen.classList.remove("hidden");
    nav.classList.remove("hidden");
    nav.style.opacity = 1;
    countdownElement.classList.remove("transparent");
    countdownElement.classList.add("fade-in-scale");

    let index = 0;
    RHYME_RUSH_GLOBALS.countdownInterval = setInterval(function () {
      if (countdownNumber <= 0) {
        // this is when the game starts
        clearInterval(RHYME_RUSH_GLOBALS.countdownInterval);
        // document.getElementById("countdown").classList.add("hidden");
        startGame();
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
        countdownElement.textContent = countdownNumber;
        countdownNumber--;
      }
    }, 800);
  }, CIRCLE_TRANSITION_DURATION); // same duration as the CSS transition

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
    document.getElementById("rhyme-goes-here-box").focus();
    dumb.remove();
  }, 3010);
  // END HACK
}

// -- End Countdown block -----------------------------------------------------

// Start Game block -----------------------------------------------------------

function startGame() {
  // analytics event
  gtag("event", "game_start", {
    event_category: "game",
    event_label: "Game Started",
    value: RHYME_RUSH_GLOBALS.isChallengeMode ? "challenge" : "normal", // Assuming you have a boolean flag for challenge mode
  });

  // similar to the countdown, we do another cirlce transition
  const gameScreen = document.getElementsByClassName("game")[0];
  const countdownScreen = document.getElementsByClassName("get-ready")[0];
  const nav = document.getElementsByClassName("nav")[0];
  nav.classList.remove("hidden");

  const circle = document.getElementsByClassName("transition-circle")[1];
  // this time we want to start the circle from the center of the screen
  const x = window.innerWidth / 2;
  const y = window.innerHeight / 2;
  const maxDistance = getMaxDistance(x, y);

  // Initially set the circle to emanate from the click point
  circle.style.left = `${x}px`;
  circle.style.top = `${y}px`;
  circle.style.width = "0px";
  circle.style.height = "0px";
  circle.style.opacity = "1";

  // force animation elements to happen in the right order
  requestAnimationFrame(() => {
    const circleDiameter = maxDistance * 2 - 25; // 25 is the box shadow
    circle.style.width = `${circleDiameter}px`;
    circle.style.height = `${circleDiameter}px`;
    circle.style.left = `${x - maxDistance}px`;
    circle.style.top = `${y - maxDistance}px`;
  });
  nav.style.color = "var(--off-white)";
  // Hide the count screen and show the game screen after the animation
  setTimeout(() => {
    document.body.style.backgroundColor = "var(--off-white)";
    countdownScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
  }, CIRCLE_TRANSITION_DURATION);

  // lets get the counter started
  startTimer();

  if (!RHYME_RUSH_GLOBALS.isChallengeMode) {
    // get a random word from the starter words array
    const candidateWord =
      STARTER_WORDS[Math.floor(Math.random() * STARTER_WORDS.length)];
    // normalize the word
    // targetWord = "rhyme";
    RHYME_RUSH_GLOBALS.targetWord = normalize(candidateWord);
    // make sure it's in the dictionary
    while (!pronunciationExists(RHYME_RUSH_GLOBALS.targetWord)) {
      RHYME_RUSH_GLOBALS.targetWord =
        STARTER_WORDS[Math.floor(Math.random() * STARTER_WORDS.length)];
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
      // textInput.blur();
      // endGame();
    }
    RHYME_RUSH_GLOBALS.clock_seconds--;
  }, 1000);
}

// -- End Start Game block ----------------------------------------------------

// Submit Word block ----------------------------------------------------------
function submitWord(event) {
  event.preventDefault();
  // Get the user input and normalize it
  const userInput = normalize(RHYME_GOES_HERE_BOX.value);
  // prevent them from submitting an empty string
  if (userInput === "") return;
  // prevent submitting the same word as the target word
  if (userInput === RHYME_RUSH_GLOBALS.targetWord) {
    //updateStatusMessage("You can't rhyme with the target word!");
    console.log("You can't rhyme with the target word!");
    RHYME_GOES_HERE_BOX.value = "";
    return;
  }

  if (pronunciationExists(userInput)) {
    // see if the user has already guessed this word
    if (RHYME_RUSH_GLOBALS.strongGuesses.has(userInput)) {
      //updateStatusMessage(`Already found "${userInput}"`);
      console.log(`Already found "${userInput}"`);
    } else if (RHYME_RUSH_GLOBALS.weakGuesses.has(userInput)) {
      //updateStatusMessage(`"${userInput}" already guessed`);
      console.log(`"${userInput}" already guessed`);
    } else {
      handleKnownPronunciation(userInput);
      // console.log("handleKnownPronunciation");
    }
  } else {
    // see if the user has already guessed this word
    if (RHYME_RUSH_GLOBALS.badGuesses.has(userInput)) {
      //updateStatusMessage(`Already tried unknown word "${userInput}"`);
      console.log(`Already tried unknown word "${userInput}"`);
    } else {
      // update status to show that the word is not in the dictionary
      //updateStatusMessage(`"${userInput}" not found in dictionary`);
      console.log(`"${userInput}" not found in dictionary`);
      // add the word to the bad guesses set
      RHYME_RUSH_GLOBALS.badGuesses.add(userInput);
    }
  }
  RHYME_GOES_HERE_BOX.value = "";
}

// RHYME SCORING UTILITY FUNCTIONS --------------------------------------------
function normalize(word) {
  return word.trim().toUpperCase();
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

  // first we check to see if the pronunciation is a perfect rhyme
  if (
    isPerfectRhyme(testPronunciation, RHYME_RUSH_GLOBALS.targetPronunciation)
  ) {
    // calculate the score, add it to the total, and update the score display
    let points = 0;
    if (testDistance === 0) {
      // update status message because this is a "rich rhyme"
      // updateStatusMessage(`"${userInput}" is a rich rhyme! +30 points`);
      console.log(`"${userInput}" is a rich rhyme! +30 points`);
      // updateScore(30);
      points = 30;
    } else {
      // calculate bonus points for a perfect rhyme as the inverse of the edit distance
      const bonusPoints = Math.ceil(10 / testDistance);

      // update status message to show perfect rhyme, 10 points plus bonus points
      // updateStatusMessage(
      //   `Perfect rhyme! +10 points +${bonusPoints} phonetic bonus`
      // );
      console.log(`Perfect rhyme! +10 points +${bonusPoints} phonetic bonus`);
      // update the score
      // updateScore(10 + bonusPoints);
      points = 10 + bonusPoints;
    }
    // add the word to our strong guesses set
    RHYME_RUSH_GLOBALS.strongGuesses.add(userInput);
    // update the display of guesses
    // updatePreviousGuesses(userInput);
    // add the word and associated info to the final guesses array
    RHYME_RUSH_GLOBALS.finalGuesses.push({
      word: userInput,
      pronunciation: testPronunciation,
      distance: testDistance,
      points: points,
      category: "perfect",
    });
    // } else if (
    //   isOffRhyme(testPronunciation, RHYME_RUSH_GLOBALS.targetPronunciation)
    // ) {
    //   // points for an offrhyme will be almost as much as a perfect rhyme, lets say, base score of 7
    //   // plus a bonus for the edit distance
    //   // we should be garunteed to have edit distance of at least 1 because we've already checked for perfect rhymes
    //   // so we'll add 1 to the edit distance to avoid dividing by 0
    //   if (testDistance === 0) {
    //     testDistance = 1;
    //   }
    //   let points = 7;
    //   const bonusPoints = Math.ceil(7 / testDistance);

    //   // update status message to show off rhyme, 7 points plus bonus points
    //   //updateStatusMessage(`Off rhyme! +7 points +${bonusPoints} phonetic bonus`);
    //   // update the score
    //   //updateScore(7 + bonusPoints);
    //   points += bonusPoints;
    //   // add the word to our strong guesses set
    //   RHYME_RUSH_GLOBALS.strongGuesses.add(userInput);
    //   // update the display of guesses
    //   //updatePreviousGuesses(userInput);
    //   // add the word and associated info to the final guesses array
    //   RHYME_RUSH_GLOBALS.finalGuesses.push({
    //     word: userInput,
    //     pronunciation: testPronunciation,
    //     distance: testDistance,
    //     points: points,
    //     category: "off",
    //   });
    // } else if (
    //   isSlantRhyme(testPronunciation, RHYME_RUSH_GLOBALS.targetPronunciation)
    // ) {
    //   // we'll score slant rhymes similarly, but give them a base score of 5 points. otherwise
    //   // the process is the same as off rhymes
    //   if (testDistance === 0) {
    //     testDistance = 1;
    //   }
    //   let points = 5;
    //   const bonusPoints = Math.ceil(5 / testDistance);

    //   // update status message to show off rhyme, 5 points plus bonus points
    //   // updateStatusMessage(
    //   //   `Slant rhyme! +5 points +${bonusPoints} phonetic bonus`
    //   // );
    //   // update the score
    //   // updateScore(5 + bonusPoints);
    //   points += bonusPoints;
    //   // add the word to our strong guesses set
    //   RHYME_RUSH_GLOBALS.strongGuesses.add(userInput);
    //   // update the display of guesses
    //   updatePreviousGuesses(userInput);
    //   // add the word and associated info to the final guesses array
    //   RHYME_RUSH_GLOBALS.finalGuesses.push({
    //     word: userInput,
    //     pronunciation: testPronunciation,
    //     distance: testDistance,
    //     points: points,
    //     category: "slant",
    //   });
  } else {
    // near rhymes are a little more complicated
    const threshold = Math.ceil(RHYME_RUSH_GLOBALS.maxEditDistance / 2);
    if (testDistance <= threshold) {
      if (testDistance === 0) {
        testDistance = 1;
      }
      const points = Math.ceil(3 / testDistance);
      RHYME_RUSH_GLOBALS.strongGuesses.add(userInput);
      // updateScore(points);
      // updatePreviousGuesses(userInput);
      // updateStatusMessage(`"${userInput}" is a near rhyme! +${points} points`);
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
      // updateStatusMessage(`"${userInput}" is not a close enough rhyme match`);
    }
  }
}

function isPerfectRhyme(testPronunciation, targetPronunciation) {
  // get the stressed part of the pronunciation
  const testStressed = getStressedRhymePart(testPronunciation);
  const targetStressed = getStressedRhymePart(
    RHYME_RUSH_GLOBALS.targetPronunciation
  );
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
// -- End Display Helper Functions --------------------------------------------

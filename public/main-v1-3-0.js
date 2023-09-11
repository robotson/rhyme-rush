// GLOBALS
// GLOBAL CONSTANTS
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
  let countdownNumber = 3;

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
    textInput.focus();
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

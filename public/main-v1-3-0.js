//-----------------------------------------------------------------------------
// fix document height on mobile browsers/ prevent resizing on pull-to-refresh
const MOBILE_BREAKPOINT = 400;
let viewportHeight = window.innerHeight;
let lastScrollY = window.scrollY;
let isMobile = window.innerWidth <= MOBILE_BREAKPOINT; // Adjust 768 to your mobile breakpoint
// Function to set the height
const setViewportHeight = () => {
  document.documentElement.style.setProperty(
    "--doc-height",
    `${viewportHeight}px`
  );
};
// Function to determine if we should update the height
const shouldUpdateHeight = () => {
  // On mobile and not at the top of the viewport (not a pull-to-refresh)
  return isMobile && (window.scrollY > 1 || lastScrollY > 1);
};
// Initial set
setViewportHeight();
// Listen for resize
window.addEventListener("resize", () => {
  isMobile = window.innerWidth <= MOBILE_BREAKPOINT; // Recheck if mobile
  if (!isMobile) {
    // On desktop, revert to normal behavior
    viewportHeight = window.innerHeight;
    setViewportHeight();
  } else if (shouldUpdateHeight()) {
    viewportHeight = window.innerHeight;
    setViewportHeight();
  }
});
// Listen for scroll
window.addEventListener("scroll", () => {
  lastScrollY = window.scrollY;
});
// -- End Fix doc height block ------------------------------------------------

// Start Countdown block ------------------------------------------------------
const CIRCLE_TRANSITION_DURATION = 400;
const OFF_BLACK = "#1d1b1b";
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
  let countdownNumber = 0;

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
    countdownInterval = setInterval(function () {
      if (countdownNumber <= 0) {
        // this is when the game starts
        clearInterval(countdownInterval);
        // document.getElementById("countdown").classList.add("hidden");
        startGame();
      } else {
        // get zeoth element and hide it
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
const INITIAL_TIMER_VALUE = 89;
let clock_seconds = INITIAL_TIMER_VALUE;
function startGame() {
  // analytics event
  gtag("event", "game_start", {
    event_category: "game",
    event_label: "Game Started",
    value: isChallengeMode ? "challenge" : "normal", // Assuming you have a boolean flag for challenge mode
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
}
// helper for updating the timer
function updateTimer(seconds) {
  // split timer into hundreds, tens, and ones
  const hundreds = Math.floor(seconds / 100);
  const tens = Math.floor((seconds - hundreds * 100) / 10);
  const ones = seconds - hundreds * 100 - tens * 10;
  // update the timer
  const timerNumberContainer = document.getElementsByClassName(
    "timer-number-container"
  )[0];
  // each child of the timer number container represents a digit
  const hundredsDigit = timerNumberContainer.children[0];
  const tensDigit = timerNumberContainer.children[1];
  const onesDigit = timerNumberContainer.children[2];
  hundredsDigit.textContent = hundreds;
  tensDigit.textContent = tens;
  onesDigit.textContent = ones;
}
// helper for keeping track of the timer
function startTimer() {
  timer = setInterval(function () {
    updateTimer(clock_seconds);
    if (clock_seconds <= 0) {
      clearInterval(timer);
      textInput.blur();
      endGame();
    }

    clock_seconds--;
  }, 1000);
}

// function startGame() {
//   // When game starts
//   gtag("event", "game_start", {
//     event_category: "game",
//     event_label: "Game Started",
//     value: isChallengeMode ? "challenge" : "normal", // Assuming you have a boolean flag for challenge mode
//   });

//   // hide the countdown and show the playing state
//   initialState.classList.add("hidden");
//   playingState.classList.remove("hidden");
//   // start the timer
//   document.getElementById("timer").textContent = INITIAL_TIME_DISPLAY;
//   startTimer();

//   // we have a routine for setting the target word
//   // either we're in challenge mode and the target word is set
//   // or we're in normal mode and we need to set the target word
//   if (!isChallengeMode) {
//     // get a random word from the starter words array
//     targetWord = starterWords[Math.floor(Math.random() * starterWords.length)];
//     // normalize the word
//     // targetWord = "rhyme";
//     targetWord = normalize(targetWord);
//     // make sure it's in the dictionary
//     while (!pronunciationExists(targetWord)) {
//       targetWord =
//         starterWords[Math.floor(Math.random() * starterWords.length)];
//       targetWord = normalize(targetWord);
//     }
//   }
//   wordDisplay.textContent = targetWord;
//   // most common pronunciation is the first one
//   targetPronunciation = dictionary[targetWord][0];
//   targetASCIIBET = convertToASCIIBET(targetPronunciation);
//   maxEditDistance = targetASCIIBET.length;
// }

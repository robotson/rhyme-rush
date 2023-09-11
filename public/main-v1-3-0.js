//-----------------------------------------------------------------------------
// fix document height on mobile browsers/ prevent resizing on pull-to-refresh
const MOBILE_BREAKPOINT = 400;
let viewportHeight = window.innerHeight;
let lastScrollY = window.scrollY;
let isMobile = window.innerWidth <= MOBILE_BREAKPOINT; // Adjust 768 to your mobile breakpoint
// Function to set the height
const setViewportHeight = () => {
  console.log("setViewportHeight called");
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

// Usage

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
  const circle = document.getElementById("transition-circle");
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

    nav.style.opacity = 1;
    // requestAnimationFrame(() => {
    countdownElement.classList.remove("transparent");
    countdownElement.classList.add("fade-in-scale");
    // });
    let index = 0;
    countdownInterval = setInterval(function () {
      if (countdownNumber <= 0) {
        // this is when the game starts
        clearInterval(countdownInterval);
        document.getElementById("countdown").classList.add("hidden");
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

    // nav.height = 48;
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

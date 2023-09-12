const endState = document.getElementById("end-state");
const modal = document.getElementById("instruction-modal");
const challengeModal = document.getElementById("challenge-modal");
const challengeFriendButton = document.getElementById("challenge-button");
const closeChallengeModalButton = document.getElementById(
  "close-challenge-modal"
);
const howToButton = document.getElementById("how-to-play");
const modalCloseButton = document.getElementsByClassName("close-button")[0];
const modalBottomDoneButton = document.getElementById("modal-bottom-done");
const playingState = document.getElementById("playing-state");
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
const welcomeChallengeMessage = document.getElementById(
  "welcome-challenge-message"
);
const warningChallengeMessage = document.getElementById(
  "warning-challenge-message"
);

const baseURL = window.location.origin;

let challengeLink = `${baseURL}/challenge/`;
let maxEditDistance = 0;

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
        targetWord = normalizedWord;
        isChallengeMode = true;
        // toggle the visibility of the welcome message and the start button
        welcomeChallengeMessage.classList.remove("collapsed");
        welcomeChallengeMessage.classList.add("expanded");
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
  warningChallengeMessage.classList.remove("collapsed");
  warningChallengeMessage.classList.add("expanded");
  // update the url to remove the invalid word
  window.history.pushState({}, "", "/");
}

// called when the timer runs out
function endGame() {
  // When game ends
  gtag("event", "game_end", {
    event_category: "game",
    event_label: "Game Ended",
    value: score, // Assuming you have a variable to store the final score
  });

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

  // recreate the challenge link just in case we got to the page from a weird state
  challengeLink = `${baseURL}/challenge/`;
  challengeLink += btoa(targetWord);
  challengeLinkInput.value = challengeLink;
  challengeMessage.value = `I got ${score} points in Rhyme Rush! Can you beat my score? ${challengeLink}`;
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
  welcomeChallengeMessage.classList.remove("expanded");
  welcomeChallengeMessage.classList.add("collapsed");
  warningChallengeMessage.classList.remove("expanded");
  warningChallengeMessage.classList.add("collapsed");
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

// EVENT LISTENERS

// Listen for the restart button to be clicked
restartButton.addEventListener("click", resetGameState);

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

// RHYME CHECKING FUNCTIONS

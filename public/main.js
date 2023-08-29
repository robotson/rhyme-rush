document.addEventListener("DOMContentLoaded", function () {
  const initialState = document.getElementById("initial-state");
  const endState = document.getElementById("end-state");
  const playingState = document.getElementById("playing-state");
  const startButton = document.getElementById("start-button");
  const restartButton = document.getElementById("restart-button");
  const finalScore = document.getElementById("final-score");

  let countdownInterval;

  let score = 0;
  let timer;
  let timeLeft = 119; // 2 minutes in seconds minus 1 for the delay in loading

  function startCountdown() {
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

  // Function to start the game
  function startGame() {
    initialState.classList.add("hidden");
    playingState.classList.remove("hidden");
    startTimer();
    // Initialize your game logic here
  }

  // Function to end the game
  function endGame() {
    timeLeft = 119;
    document.getElementById("timer").textContent = "2:00";
    document.getElementById("countdown-number").textContent = "3";
    playingState.classList.add("hidden");
    endState.classList.remove("hidden");
    finalScore.textContent = score;
    score = 0;
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
});

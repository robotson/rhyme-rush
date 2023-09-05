// Global variables
let dictionary = {};
let targetWord = "";
let targetPronunciation = "";
let targetASCIIBET = "";
let maxEditDistance = 0;

/// find string code: ".*ER[012].*ER[012].*"

// DOM Elements
const form = document.querySelector("form");
const input = document.querySelector("input[type='text']");
const results = document.querySelector(".results");

// Initialize
getDict();

// Event Listeners
form.addEventListener("submit", handleFormSubmit);

// Functions
async function getDict() {
  const response = await fetch("./dictionary.json");
  dictionary = await response.json();
}
function calculateScore(baseline, distance) {
  if (baseline === 10 && distance === 0) {
    return 30;
  }
  if (distance === 0) {
    distance = 1;
  }
  return baseline + Math.ceil(baseline / distance);
}

function handleFormSubmit(e) {
  e.preventDefault();
  const userInput = input.value.toUpperCase().trim();
  if (!dictionary[userInput]) {
    results.innerHTML = "Word not found in dictionary";
    return;
  }
  let rhymesArray = [];
  let offRhymesArray = [];

  let slantRhymesArray = [];
  let nearRhymesArray = [];

  targetWord = userInput;
  targetPronunciation = dictionary[targetWord][0];
  targetASCIIBET = convertToASCIIBET(targetPronunciation);
  maxEditDistance = targetASCIIBET.length;

  // select target div and fill in info
  const targetDiv = document.querySelector(".target");
  targetDiv.innerHTML = `<h2>Target</h2><p><span class="word">${targetWord}:</span> <span class="pronunciation">${targetPronunciation}</span> <span class="distance">${maxEditDistance}</span></p>`;

  for (const testWord in dictionary) {
    const [testPronunciation, testDistance] = getClosestPronunciation(testWord);
    if (isPerfectRhyme(testPronunciation, targetPronunciation)) {
      rhymesArray.push({
        word: testWord,
        pronunciation: testPronunciation,
        distance: testDistance,
        score: calculateScore(10, testDistance),
      });
    } else if (isOffRhyme(testPronunciation, targetPronunciation)) {
      offRhymesArray.push({
        word: testWord,
        pronunciation: testPronunciation,
        distance: testDistance,
        score: calculateScore(7, testDistance),
      });
    } else if (isSlantRhyme(testPronunciation, targetPronunciation)) {
      slantRhymesArray.push({
        word: testWord,
        pronunciation: testPronunciation,
        distance: testDistance,
        score: calculateScore(5, testDistance),
      });
    } else {
      const threshold = Math.ceil(maxEditDistance / 2);
      if (testDistance <= threshold) {
        const points = Math.ceil(3 / testDistance);
        nearRhymesArray.push({
          word: testWord,
          pronunciation: testPronunciation,
          distance: testDistance,
          score: points,
        });
      }
    }
  }

  renderResults(
    filterAndSort(rhymesArray, maxEditDistance),
    filterAndSort(offRhymesArray, maxEditDistance),
    filterAndSort(slantRhymesArray, maxEditDistance),
    filterAndSort(nearRhymesArray, maxEditDistance)
  );
}

function getAsciibetTargets(word) {
  return dict[word].map((pronunciation) => convertToASCIIBET(pronunciation));
}

function filterAndSort(array, maxEditDistance) {
  // array = array.filter((a) => a.editDistance <= maxEditDistance);
  array.sort((a, b) => a.distance - b.distance);
  return array;
}

function renderResults(
  rhymesArray,
  offRhymesArray,
  slantRhymesArray,
  nearRhymesArray
) {
  let html = generateHTMLList("Rhymes", rhymesArray);
  html += generateHTMLList("Off Rhymes", offRhymesArray);
  html += generateHTMLList("Slant Rhymes", slantRhymesArray);

  html += generateHTMLList("Near Rhymes", nearRhymesArray);
  results.innerHTML = html;
}

function generateHTMLList(title, array) {
  let html = `<h2>${title}</h2>`;
  for (const [index, rhyme] of array.entries()) {
    html += `<p><span>${index + 1}.</span> <span class="word">${
      rhyme.word
    }:</span> <span class="pronunciation">${
      rhyme.pronunciation
    }</span> <span class="distance">${
      rhyme.distance
    }</span> <span class="score">${rhyme.score}</span></p>`;
  }
  return html;
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
      // console.warn(`Unknown phoneme: ${phoneme}`);
      asciibet += phoneme;
    }
  }

  // return asciibet;
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
    const threshold = Math.floor(maxEditDistance / 2);
    if (testDistance <= threshold) {
      // it's a near rhyme so we add it to strong guesses, update the score, and update the display
      // and add it to the final guesses array
      // we'll calculate the points as the inverse of the edit distance
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

// compare two pronunciations to see if they are a perfect rhyme
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

  // const testPattern = generateOffRhymePattern(testPronunciation);
  const targetPattern = generateOffRhymePattern(targetPronunciation);
  if (new RegExp(targetPattern).test(testPronunciation)) {
    console.log(targetPattern);
  }
  // Compare the two patterns
  return (
    // new RegExp(testPattern).test(targetPronunciation) ||
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

  // const testPattern = generateSlantRhymePattern(testPronunciation);
  const targetPattern = generateSlantRhymePattern(targetPronunciation);

  // Compare the two patterns
  return (
    // new RegExp(testPattern).test(targetPronunciation) ||
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

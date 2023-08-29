// Global variables
let dict = {};

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
  dict = await response.json();
}

function handleFormSubmit(e) {
  e.preventDefault();
  const word = input.value.toUpperCase().trim();
  if (!dict[word]) {
    results.innerHTML = "Word not found in dictionary";
    return;
  }

  const rhymesArray = findUniqueRhymes(word, findRhymes);
  const slantRhymesArray = findUniqueRhymes(word, findSlantRhymes);
  const offRhymesArray = findUniqueRhymes(word, findOffRhymes);

  const asciibetTargets = getAsciibetTargets(word);
  const maxEditDistance = Math.max(...asciibetTargets.map((t) => t.length));

  updateEditDistances(rhymesArray, asciibetTargets);
  updateEditDistances(slantRhymesArray, asciibetTargets);
  updateEditDistances(offRhymesArray, asciibetTargets);

  renderResults(
    filterAndSort(rhymesArray, maxEditDistance),
    filterAndSort(slantRhymesArray, maxEditDistance),
    filterAndSort(offRhymesArray, maxEditDistance)
  );
}

function findUniqueRhymes(word, findFn) {
  let uniqueRhymes = new Set();
  for (const pronunciation of dict[word]) {
    uniqueRhymes = new Set([...uniqueRhymes, ...findFn(pronunciation, false)]);
  }
  return Array.from(uniqueRhymes).filter((rhyme) => rhyme.word !== word);
}

function getAsciibetTargets(word) {
  return dict[word].map((pronunciation) => convertToASCIIBET(pronunciation));
}

function updateEditDistances(array, asciibetTargets) {
  for (const [index, rhyme] of array.entries()) {
    array[index].editDistance = Number.MAX_SAFE_INTEGER;
    for (const asciibetTarget of asciibetTargets) {
      const candidateEditDistance = editDistance(
        asciibetTarget,
        convertToASCIIBET(rhyme.pronunciation)
      );
      if (candidateEditDistance < array[index].editDistance) {
        array[index].editDistance = candidateEditDistance;
      }
    }
  }
}

function filterAndSort(array, maxEditDistance) {
  array = array.filter((a) => a.editDistance <= maxEditDistance);
  array.sort((a, b) => a.editDistance - b.editDistance);
  return array;
}

function renderResults(rhymesArray, slantRhymesArray, offRhymesArray) {
  let html = generateHTMLList("Rhymes", rhymesArray);
  html += generateHTMLList("Slant Rhymes", slantRhymesArray);
  html += generateHTMLList("Off Rhymes", offRhymesArray);
  results.innerHTML = html;
}

function generateHTMLList(title, array) {
  let html = `<h2>${title}</h2><ul>`;
  for (const rhyme of array) {
    html += `<li>${rhyme.word}: ${rhyme.pronunciation} - ${rhyme.editDistance}</li>`;
  }
  return html + "</ul>";
}

// Function to find rhymes for a given pronunciation
function findRhymes(pronunciation, expansive = false) {
  const rhymes = [];
  const seen = new Set();
  // Extract the rhyme part from the input pronunciation
  const stresses = ["1", "2", "0"];
  let index = -1;
  for (const stress of stresses) {
    index = pronunciation.lastIndexOf(stress);
    if (index > -1) {
      break;
    }
  }

  if (index === -1) {
    return [];
  }

  let rhymePart = pronunciation.slice(index - 2);

  // we're going to start including a more expansive definition of rhymes
  // we want to basically start with as long of a rhyme as possible
  // and then systematically move backwards with vowles and include more rhymes as well

  // we will do this for as many vowel sounds as there are in the rhyme part
  // to do this i need a one liner that counts the occurances of ..[012] in a string
  // then we will use that to determine how many times to loop through the following code
  let numVowels = (rhymePart.match(/[012]/g) || []).length;
  console.log(numVowels);
  while (numVowels > 0) {
    const rhymePartEnd = expansive
      ? rhymePart.replace(/[012]/, ".") + "$"
      : rhymePart + "$";

    console.log(rhymePartEnd);
    for (const word in dict) {
      // either we want to match the rhymePart exactly or we want to match the rhymePart with a wildcard at the end

      // we need to loop through each pronunciation of the word
      for (const pron of dict[word]) {
        // we need to check if the pron matches the rhymePartWild
        if (pron.match(rhymePartEnd) && !seen.has(word)) {
          // if it does we need to add it to the rhymes array
          rhymes.push({ word: word, pronunciation: pron });
          seen.add(word);
        }
      }
    }

    // if the number of vowels is greater then one then lets get the index of the next vowel
    if (numVowels > 1) {
      rhymePart = rhymePart.slice(3);
      index = -1;

      // get the index of the next vowel regardless of stress
      index = rhymePart.search(/[012]/);

      if (index !== -1) {
        rhymePart = rhymePart.slice(index - 2);
      }
    }
    numVowels--;
    numVowels = 0;
  }

  return rhymes;
}

// Calling function would remove duplicates and target word,
// so we didn't do that here to keep this function single-responsibility

// next we need a function to get the assonance rhymes, which we'll call slant rhymes

function findSlantRhymes(pronunciation, expansive = false) {
  const rhymes = [];
  const seen = new Set();

  // the approach we'll take here is to try to match all the vowels,
  // then cut off the first vowel and try to match the rest again.

  let index = -1;

  index = pronunciation.search(/[012]/);

  while (index !== -1) {
    // split the pronunciation into hyphenated parts
    const pronParts = pronunciation.split("-");

    // for each of those parts, surround the vowel with expressions to match
    // zero or greater amount of any of these: B|CH|D|DH|F|G|HH|JH|K|L|M|N|NG|P|R|S|SH|T|TH|V|W|Y|Z|ZH
    // and then join them back together with hyphens
    let pronWild = pronParts
      .map((part) => {
        let vowel = part.match(/..[012]/)[0];

        // surround the vowel with expressions to match
        // zero or greater amount of any of these: B|CH|D|DH|F|G|HH|JH|K|L|M|N|NG|P|R|S|SH|T|TH|V|W|Y|Z|ZH
        return (
          "(B|CH|D|DH|F|G|HH|JH|K|L|M|N|NG|P|R|S|SH|T|TH|V|W|Y|Z|ZH| )*" +
          vowel +
          "(B|CH|D|DH|F|G|HH|JH|K|L|M|N|NG|P|R|S|SH|T|TH|V|W|Y|Z|ZH| )*"
        );
      })
      .join("-");

    console.log(pronWild);

    ///add an end of string to the pronWild
    pronWild = pronWild + "$";
    // now we need to loop through each word in the dictionary
    for (const word in dict) {
      // and each pronunciation of that word
      for (const pron of dict[word]) {
        // and check if the pron matches the pronWild
        if (pron.match(pronWild) && !seen.has(word)) {
          // if it does we need to add it to the rhymes array
          rhymes.push({
            word: word,
            pronunciation: pron,
          });
          seen.add(word);
        }
      }
    }

    // now we need to cut off the first vowel and try again
    pronunciation = pronunciation.slice(index + 1);
    index = pronunciation.search(/[012]/);
    //make sure to get rid of any hyphens that occur before index
    hyphenIndex = pronunciation.search("-");
    if (hyphenIndex !== -1 && hyphenIndex < index) {
      pronunciation = pronunciation.slice(hyphenIndex + 1);
    }
    index = -1; // lol
  }

  return rhymes;
}

/// next we'll work on consonance rhymes, which we'll call "off rhymes"
function findOffRhymes(pronunciation, expansive = false) {
  const rhymes = [];
  const seen = new Set();
  // for this to work we basically want to match all the consonants
  // but replace the vowels with wildcards

  // oh, but first we want to chop off everything before the last properly stressed vowel
  // so we need to find the index of the last properly stressed vowel
  // and then chop off everything before that vowel's consonants (on either side)
  let index = -1;
  const stresses = ["1", "2", "0"];
  for (const stress of stresses) {
    index = pronunciation.lastIndexOf(stress);
    if (index > -1) {
      break;
    }
  }
  // now we need to know the index of the first hyphen if there is one and if it comes before the index
  let hyphenIndex = pronunciation.search("-");
  if (hyphenIndex !== -1 && hyphenIndex < index) {
    // if there is a hyphen and it comes before the index then we need to chop off everything before the hyphen
    pronunciation = pronunciation.slice(hyphenIndex + 1);
    pronunciation = pronunciation.trim();
  }

  // to handle rhotics lets split on any occurances of either ..[012] R or ER[012]
  // lets do that now
  let pronParts = pronunciation.split(/(..[012] R|ER[012])/);
  pronParts = pronParts.map((part, index) => {
    return part.replace(/(..[012] R|ER[012])/g, "!");
  });

  // for each of those parts we want to replace the vowels with wildcards
  // and then join them back together with a special OR pattern to match rhotics
  pronParts = pronParts.map((part, index) => {
    return part.replace(/..[012]/g, ".[^R][012]");
  });

  pronParts = pronParts.map((part, index) => {
    return part.replace("!", "(..[012] R|ER[012])");
  });

  let pronWild = pronParts.join("");
  // add an end of string to the pronWild
  pronWild = pronWild + "$";

  // now we need to loop through each word in the dictionary
  for (const word in dict) {
    // and each pronunciation of that word
    for (const pron of dict[word]) {
      // and check if the pron matches the pronWild
      if (pron.match(pronWild) && !seen.has(word)) {
        // if it does we need to add it to the rhymes array
        rhymes.push({
          word: word,
          pronunciation: pron,
        });
        seen.add(word);
      }
    }
  }

  return rhymes;
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

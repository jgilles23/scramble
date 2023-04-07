"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let baseURL;
//Check environment & Assign a few variables depending if this is the test or live environment
const testURL = "http://127.0.0.1:5500/";
if (window.location.href.slice(0, testURL.length) === testURL) {
    //Test environemnt
    console.log("Test environment");
    baseURL = "http://127.0.0.1:5500/";
}
else {
    //Production environemnt
    console.log("Production environment");
    baseURL = "https://jgilles23.github.io/scramble/";
}
//Function for loading json files
function load_file_json2(filepath) {
    return __awaiter(this, void 0, void 0, function* () {
        //Load a file and convert to object using json
        let response = yield fetch(filepath);
        let obj = yield response.json();
        return obj;
    });
}
//Create the dictionary
let dictionary;
let outside = "hello";
function letterToNum(letter) {
    return letter.charCodeAt(0) - 65;
}
function numToLetter(num) {
    return String.fromCharCode(num + 65);
}
function createCount(word) {
    let counts = Array(26).fill(0);
    for (let i = 0; i < word.length; i++) {
        counts[letterToNum(word[i])] += 1;
    }
    return counts;
}
function compareWords(word, previousWord) {
    // Analyizes the newWord aganist the old word and creats a wordanalysis objkect
    // Object contains info about the comparison of the two words
    const analysis = {
        word: word,
        wordLength: word.length,
        previousWord: previousWord,
        valid: word.toLowerCase() in dictionary,
        matchCount: 0,
        wordMatch: Array(word.length).fill(false),
        letters: createCount(word),
        matchLetters: Array(26).fill(0),
        skipLetters: createCount(previousWord),
        newLetters: Array(26).fill(0),
    };
    //Create word counts
    const wordCounts = createCount(word);
    const previousCount = createCount(previousWord);
    //Perform letter match
    for (let i = 0; i < word.length; i++) {
        let num = letterToNum(word[i]); //Index number of the selected letter
        if (analysis.skipLetters[num] > 0) {
            //Letter found in the previousword
            analysis.matchCount += 1;
            analysis.wordMatch[i] = true;
            analysis.matchLetters[num] += 1;
            analysis.skipLetters[num] -= 1;
        }
        else {
            //Letter not found in the previous word
            analysis.newLetters[num] += 1;
        }
    }
    return analysis;
}
function createDiv(parentDiv, className, textContent) {
    //Create a new HTML div element set the className, textContent, and assign as a child of parent
    let newDiv = document.createElement('div');
    if (className !== "") {
        newDiv.classList.add(className);
    }
    if (textContent !== "") {
        newDiv.textContent = textContent;
    }
    parentDiv.appendChild(newDiv);
    return newDiv;
}
function removeDivChildren(div) {
    div.innerHTML = "";
}
// Main script for scramble car game
class Level {
    constructor(previousLevel) {
        //Create a word on the word list --- use the functions below to set to add a word
        //Link to other words & highlight letters / count statistics
        this.previousLevel = previousLevel;
        if (this.previousLevel !== undefined) {
            this.previousLevel.nextLevel = this;
            this.level = this.previousLevel.level + 1;
        }
        else {
            this.level = 0;
        }
        this.nextLevel = undefined;
        //Set other paramters
        this.expanded = true;
        //Find the main div element to place under
        const gameAreaDiv = document.getElementById("game-area");
        const levelAreaDiv = createDiv(gameAreaDiv, "", "");
        //Create the top line
        const levelTopLineDiv = createDiv(levelAreaDiv, "level-top-line", "");
        this.levelNumberDiv = createDiv(levelTopLineDiv, "letter", "-"); //Level Number -- added in "update"
        this.levelNumberDiv.onclick = () => {
            if (this.nextLevel === undefined) {
                this.promptChangeLevel();
            }
        };
        this.levelArrowDiv = createDiv(levelTopLineDiv, "letter", ">");
        this.levelArrowDiv.style.backgroundColor = "white";
        this.levelArrowDiv.onclick = () => {
            this.expanded = !this.expanded;
            this.update();
        };
        this.wordDiv = createDiv(levelTopLineDiv, "word", "");
        this.wordDiv.onclick = () => {
            if (this.nextLevel === undefined || this.nextLevel.word === undefined) {
                this.promptReplaceWord(); //Add onclick for the word area
            }
        };
        //Create the expanded area
        this.expansionDiv = createDiv(levelAreaDiv, "expanded-level", "start test");
        //Update
        this.update();
    }
    update() {
        //Update the elements of the Level to show correctly given how the properties of the word have been set
        this.levelNumberDiv.textContent = this.level.toString();
        //Check if should be expanded
        if (this.word === undefined) {
            this.expanded = false;
        }
        //Need to update the expansion arrow
        if (this.expanded === true) {
            this.levelArrowDiv.textContent = "v";
            this.expansionDiv.style.display = "block";
        }
        else {
            this.levelArrowDiv.textContent = ">";
            this.expansionDiv.style.display = "none";
        }
        //Remove the children of the word
        removeDivChildren(this.wordDiv);
        //Check if the word is undefined --- ending analysis
        if (this.word === undefined) {
            //IF there is no word, only put the add word button
            const addWordDiv = createDiv(this.wordDiv, "add-word-button", "add word");
            this.expansionDiv.innerHTML = ""; //Clear the expansion
            // Reset the color of the number
            this.levelNumberDiv.style.backgroundColor = "lightgrey";
            return;
        }
        //Analyize the word
        let analysis;
        if (this.previousLevel === undefined || this.previousLevel.word === undefined) {
            analysis = compareWords(this.word, "");
        }
        else {
            analysis = compareWords(this.word, this.previousLevel.word);
        }
        //Function to determine if the word is successful TODO allow for same length
        let successfulWord = this.level <= analysis.matchCount;
        if (this.previousLevel === undefined && analysis.wordLength >= this.level) {
            successfulWord = true;
        }
        //Special case where the previous word is exactly the length needed
        if (this.previousLevel !== undefined && this.previousLevel.word !== undefined && this.previousLevel.word.length === this.previousLevel.level && analysis.matchCount === this.previousLevel.level) {
            successfulWord = true;
        }
        //Update the color of the word
        if (successfulWord === true && analysis.valid === true) {
            this.levelNumberDiv.style.backgroundColor = "forestgreen";
        }
        else {
            this.levelNumberDiv.style.backgroundColor = "red";
        }
        //Build the letters
        for (let i = 0; i < this.word.length; i++) {
            let letterDiv = createDiv(this.wordDiv, "letter", this.word[i]);
            if (analysis.wordMatch[i] === true) {
                letterDiv.style.backgroundColor = "RoyalBlue";
            }
            else if (this.nextLevel === undefined || this.nextLevel.word === undefined) {
                letterDiv.style.backgroundColor = "lightgray";
            }
            else {
                letterDiv.style.backgroundColor = "darkgrey";
            }
        }
        //Helper function for making a multiplication list
        function multiplicationString(countList) {
            //Take the count list and return multiplication string
            //Form of: 3xA, 2xB, C, D
            let s = "";
            for (let i = 0; i < countList.length; i++) {
                if (countList[i] === 1) {
                    s += numToLetter(i) + ", ";
                }
                else if (countList[i] > 1) {
                    s += `${countList[i]}&#x00D7;${numToLetter(i)}, `;
                }
            }
            if (s === "") {
                return "-";
            }
            return s.slice(0, s.length - 2);
        }
        //Build the expansion
        this.expansionDiv.innerHTML = "";
        if (successfulWord === false) {
            this.expansionDiv.innerHTML += "<span class='expanded-error'>word does not match enough letters</span><br>";
        }
        if (analysis.valid === false) {
            this.expansionDiv.innerHTML += "<span class='expanded-error'>word is not in the dictionary</span><br>";
        }
        this.expansionDiv.innerHTML += `
        matches: ${analysis.matchCount}<br>
        skipped letters: ${multiplicationString(analysis.skipLetters)}<br>
        word length: ${analysis.wordLength}<br>
        letter counts: ${multiplicationString(analysis.letters)}`;
    }
    promptReplaceWord() {
        //Replace the word HTML
        let wordRespone = prompt('Input a new word:');
        if (wordRespone === null) {
            //Do nothing, user canceled the input
            return;
        }
        else if (wordRespone === "") {
            this.replaceWord(undefined);
        }
        else {
            wordRespone = wordRespone.replace(/\s/g, "");
            wordRespone = encodeURIComponent(wordRespone);
            wordRespone = wordRespone.toUpperCase();
            if (/^[a-zA-Z]+$/.test(wordRespone)) {
                //Valid input
                this.replaceWord(wordRespone);
            }
            else {
                //Invalid input try again
                this.promptReplaceWord();
                return;
            }
        }
    }
    replaceWord(word) {
        this.word = word;
        //Expand by default
        this.expanded = true;
        this.update();
        //IF the next word does not yet exist, add it
        if (this.word !== undefined && this.nextLevel === undefined) {
            new Level(this);
            // Minimize the previous levels
            if (this.previousLevel !== undefined) {
                this.previousLevel.minimizeLevels();
            }
        }
    }
    promptChangeLevel() {
        //Replace the word HTML
        let numberResponse = prompt('Input the correct level:');
        if (numberResponse === null || numberResponse === "") {
            //Do nothing, user canceled the input
            return;
        }
        else {
            numberResponse = encodeURIComponent(numberResponse);
            if (/^\d+$/.test(numberResponse)) {
                //Valid input
                this.changeLevel(parseInt(numberResponse));
            }
            else {
                //Invalid input try again
                this.promptChangeLevel();
                return;
            }
        }
    }
    changeLevel(newLevel) {
        //Change the level of the current word & propigate up and down
        this.level = newLevel;
        this.update();
        //Update previous level
        if (this.previousLevel !== undefined) {
            this.previousLevel.changeLevel(this.level - 1);
        }
    }
    minimizeLevels() {
        // Minimize this level and each level below
        this.expanded = false;
        this.update();
        //update previous levels
        if (this.previousLevel !== undefined) {
            this.previousLevel.minimizeLevels();
        }
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        //Create the dictionary
        dictionary = yield load_file_json2(baseURL + "words_dictionary.json");
        //Load the first level
        let firstLevel = new Level(undefined);
    });
}
main();
//# sourceMappingURL=main.js.map
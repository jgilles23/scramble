
let baseURL: string
//Check environment & Assign a few variables depending if this is the test or live environment
const testURL = "http://127.0.0.1:5500/"
if (window.location.href.slice(0, testURL.length) === testURL) {
    //Test environemnt
    console.log("Test environment")
    baseURL = "http://127.0.0.1:5500/"
} else {
    //Production environemnt
    console.log("Production environment")
    baseURL = "https://jgilles23.github.io/scramble/"
}

//Function for loading json files
async function load_file_json2(filepath: string) {
    //Load a file and convert to object using json
    let response = await fetch(filepath)
    let obj = await response.json()
    return obj
}

//Create the dictionary
let dictionary: {}

interface WordAnalysis {
    word: string
    wordLevel: number // The level of the current word (minimum length & minimum matches)
    wordLength: number //Length of the word
    previousWord: string
    valid: boolean //Is this a valid word in the dictionary
    matchCount: number //Number of matching letters in new vs old word
    minimumMatches: number // How many matches are required for a successful word
    wordMatch: Array<boolean> // boolean array for each letter, true if matches previous word
    letters: Array<number> // All unique letters in the word
    matchLetters: Array<number> //letters in the new word that match the old word
    skipLetters: Array<number> //letters in the previous word that are not used
    newLetters: Array<number> //letters in the new word that are not in the previous word
    successful: boolean // If the word is successful as a successfor to the previous word --- still need to look at valid dictionary or not
}

function letterToNum(letter: string) {
    return letter.charCodeAt(0) - 65
}

function numToLetter(num: number) {
    return String.fromCharCode(num + 65)
}

function createCount(word: string): Array<number> {
    let counts = Array(26).fill(0);
    for (let i = 0; i < word.length; i++) {
        counts[letterToNum(word[i])] += 1
    }
    return counts
}

function compareWords(word: string, previousWord: string, wordLevel: number): WordAnalysis {
    // Analyizes the newWord aganist the old word and creats a wordanalysis objkect
    // Object contains info about the comparison of the two words
    const analysis: WordAnalysis = {
        word: word,
        wordLevel: wordLevel,
        wordLength: word.length,
        previousWord: previousWord,
        valid: word.toLowerCase() in dictionary,
        matchCount: 0,
        minimumMatches: Math.min(previousWord.length, wordLevel),
        wordMatch: Array(word.length).fill(false),
        letters: createCount(word),
        matchLetters: Array(26).fill(0),
        skipLetters: createCount(previousWord),
        newLetters: Array(26).fill(0),
        successful: false,
    }
    //Create word counts
    const wordCounts = createCount(word)
    const previousCount = createCount(previousWord)
    //Perform letter match
    for (let i = 0; i < word.length; i++) {
        let num = letterToNum(word[i]) //Index number of the selected letter
        if (analysis.skipLetters[num] > 0) {
            //Letter found in the previousword
            analysis.matchCount += 1
            analysis.wordMatch[i] = true
            analysis.matchLetters[num] += 1
            analysis.skipLetters[num] -= 1
        } else {
            //Letter not found in the previous word
            analysis.newLetters[num] += 1
        }
    }
    // Check if the word is a valid play
    if (word.length >= wordLevel && analysis.matchCount >= analysis.minimumMatches) {
        analysis.successful = true
    }
    return analysis
}

//Helper function for making a multiplication list
function multiplicationString(countList: Array<number>) {
    //Take the count list and return multiplication string
    //Form of: 3xA, 2xB, C, D
    let s = ""
    for (let i = 0; i < countList.length; i++) {
        if (countList[i] === 1) {
            s += numToLetter(i) + ", "
        } else if (countList[i] > 1) {
            s += `${countList[i]}&#x00D7;${numToLetter(i)}, `
        }
    }
    if (s === "") {
        return "-"
    }
    return s.slice(0, s.length - 2)
}

function createDiv(parentDiv: HTMLDivElement, className: string, textContent: string): HTMLDivElement {
    //Create a new HTML div element set the className, textContent, and assign as a child of parent
    let newDiv = document.createElement('div')
    if (className !== "") {
        newDiv.classList.add(className)
    }
    if (textContent !== "") {
        newDiv.textContent = textContent
    }
    parentDiv.appendChild(newDiv)
    return newDiv
}

function removeDivChildren(div: HTMLDivElement) {
    div.innerHTML = ""
}

class LevelBase {
    // Level with the add "add word" button
    game: Game
    level: number
    expanded: boolean
    //Div areas
    levelAreaDiv: HTMLDivElement
    levelNumberDiv: HTMLDivElement
    levelArrowDiv: HTMLDivElement
    wordDiv: HTMLDivElement
    expansionDiv: HTMLDivElement

    constructor(game: Game, level: number) {
        // Build an empty level object (has the add word button)
        this.game = game
        this.level = level
        this.expanded = true
        //Find the main div element to place under
        this.levelAreaDiv = createDiv(this.game.gameDiv, "", "")
        //Create the top line
        const levelTopLineDiv = createDiv(this.levelAreaDiv, "level-top-line", "")
        this.levelNumberDiv = createDiv(levelTopLineDiv, "letter", this.level.toString()) //Level Number
        this.levelArrowDiv = createDiv(levelTopLineDiv, "letter", ">")
        this.levelArrowDiv.style.backgroundColor = "white"
        this.levelArrowDiv.onclick = () => {
            this.updateExpansion(!this.expanded)
        }
        //Create the word area
        this.wordDiv = createDiv(levelTopLineDiv, "word", "") //on-click should be defined in the Game object
        //Create the expanded area
        this.expansionDiv = createDiv(this.levelAreaDiv, "expanded-level", "")
        this.updateExpansion(this.expanded)
    }

    updateExpansion(expansionFlag: boolean) {
        this.expanded = expansionFlag
        // Show or hide the expansion
        if (this.expanded === true) {
            this.levelArrowDiv.textContent = "v"
            this.expansionDiv.style.display = "block"
        } else {
            this.levelArrowDiv.textContent = ">"
            this.expansionDiv.style.display = "none"
        }
    }
}

class NewWordLevel extends LevelBase {
    constructor(game: Game, level: number) {
        super(game, level)
        // Class for holding the "add word" level of the game
        const addWordDiv = createDiv(this.wordDiv, "add-word-button", "add word")
        // Make adding a word clickabl
        addWordDiv.onclick = () => {
            this.game.userAddWord()
        }
        // Close the expansion
        this.updateExpansion(false)
    }
    updateLevelNumber(levelNumber:number) {
        //Update the level number of the word
        this.level = levelNumber
        this.levelNumberDiv.textContent = this.level.toString()
    }
    checkDictionary() {
        // Check the dictionary to see if there are still words that are likely
        // to fit the currently required pattern
        if (this.game.levels.length === 0) {
            return
        }
        console.log("checking")
        let word = this.game.levels[this.game.levels.length - 1].word
        console.log(word)
        let count = 0
        for (let key in dictionary) {
            const analysis = compareWords(key.toUpperCase(), word, this.level)
            if (key === "peoples") {
                console.log("here")
            }
            if (analysis.successful === true) {
                console.log("found:", key.toUpperCase())
                count += 1
                if (count > 100) {
                    return
                }
            }
        }
    }
}

// Main script for scramble car game
class Level extends LevelBase {
    // Define the word for the level
    word: string
    previousWord: string
    analysis: WordAnalysis

    constructor(game: Game, level: number, word: string, previousWord: string | "") {
        //Create a word on the word list --- use the functions below to set to add a word
        // If the previous word does not exist, input "" as the previous word
        super(game, level)
        this.word = word
        this.previousWord = previousWord
        // Analyize the word aganist the previous word
        this.analysis = compareWords(word, previousWord, this.level)
        // Update the color of the level number
        if (this.analysis.successful === true && this.analysis.valid === true) {
            this.levelNumberDiv.style.backgroundColor = "forestgreen"
        } else {
            this.levelNumberDiv.style.backgroundColor = "red"
        }
        // Build up the letters
        for (let i = 0; i < this.word.length; i++) {
            let letterDiv = createDiv(this.wordDiv, "letter", this.word[i])
            if (this.analysis.wordMatch[i] === true) {
                letterDiv.style.backgroundColor = "RoyalBlue"
            }
        }
        //Build the expansion
        if (this.analysis.matchCount < this.analysis.minimumMatches) {
            this.expansionDiv.innerHTML += `<span class='expanded-error'>word does not match ${this.analysis.minimumMatches} or more letters</span><br>`
        }
        if (this.analysis.wordLength < this.analysis.wordLevel) {
            this.expansionDiv.innerHTML += `<span class='expanded-error'>word is not at least ${this.analysis.wordLevel} letters</span><br>`
        }
        if (this.analysis.valid === false) {
            this.expansionDiv.innerHTML += "<span class='expanded-error'>word is not in the dictionary</span><br>"
        }
        this.expansionDiv.innerHTML += `
        matches: ${this.analysis.matchCount}<br>
        skipped letters: ${multiplicationString(this.analysis.skipLetters)}<br>
        word length: ${this.analysis.wordLength}<br>
        letter counts: ${multiplicationString(this.analysis.letters)}`
    }

}

class Game {
    // Class for holding the current game and manipulating the current game
    levels: Array<Level>
    addWordLevel: NewWordLevel
    baseLevelNumber: number
    gameDiv: HTMLDivElement
    constructor(gameDiv: HTMLDivElement, baseLevelNumber: number) {
        //Create a class object for holding the game
        this.levels = []
        this.baseLevelNumber = baseLevelNumber
        this.gameDiv = gameDiv
        this.addWordLevel = new NewWordLevel(this, baseLevelNumber)
        this.updateURL()
    }
    loadString(str: string) {
        // Load a string into the game --- stored in the d value
    }
    promptWord(): string | "" {
        // Prompt the user to input a new word --- returns "" if no word is provided
        let wordRespone = prompt('Input a new word:')
        if (wordRespone === null || wordRespone === "") {
            //Do nothing, user canceled the input
            return ""
        } else {
            // Sanatize the imput
            wordRespone = wordRespone.replace(/\s/g, "")
            wordRespone = encodeURIComponent(wordRespone)
            wordRespone = wordRespone.toUpperCase()
            if (/^[a-zA-Z]+$/.test(wordRespone)) {
                //Valid input
                return wordRespone
            } else {
                //Invalid input try again
                return this.promptWord()
            }
        }
    }
    userReplaceWord() {
        // replace the most recent word on the levels list after prompting the user
        // performs the equivelent of removeWord() then addWord()
        let word = this.promptWord()
        if (word === "") {
            //User did not supply a word
            return
        }
        // Remove last word, add the word
        this.removeWord()
        this.addWord(word)
    }
    userAddWord() {
        // Add a wword to the level list after prompting the user
        let word = this.promptWord()
        if (word === "") {
            //User did not supply a word
            return
        }
        this.addWord(word)
    }
    addWord(word: string) {
        // Minimize all the existing levels & make not clickable
        for (let level of this.levels) {
            level.updateExpansion(false)
            level.wordDiv.onclick = null
        }
        // Add a word to the game (add a level)
        let newWord: Level
        if (this.levels.length === 0) {
            //First level
            this.levels.push(new Level(this, this.baseLevelNumber, word, ""))
        } else {
            // Add a level
            let previousLevel = this.levels[this.levels.length - 1]
            this.levels.push(new Level(this, previousLevel.level + 1, word, previousLevel.word))
        }
        // Update the addWordLevel, put back at the end of the div
        this.addWordLevel.updateLevelNumber(this.baseLevelNumber + this.levels.length)
        this.gameDiv.appendChild(this.addWordLevel.levelAreaDiv)
        // Open the last word and make it clickable
        this.setTailWord()
        // Update url
        this.updateURL()
    }
    removeWord() {
        // Remove the most recently added word
        if (this.levels.length > 0) {
            let lastLevel = this.levels[this.levels.length - 1]
            this.gameDiv.removeChild(lastLevel.levelAreaDiv)
            this.levels.pop()
        }
        // Update the addWordLevel
        this.addWordLevel.updateLevelNumber(this.baseLevelNumber + this.levels.length)
        // Show the expansion of the last word & make it clickable
        this.setTailWord()
        // Update URL
        this.updateURL()
    }

    setTailWord() {
        //Expand the last word in the list & make it clickable
        if (this.levels.length === 0) {
            return
        }
        let lastLevel = this.levels[this.levels.length - 1]
        lastLevel.updateExpansion(true)
        lastLevel.wordDiv.onclick = () => {
            this.userReplaceWord()
        }
    }

    generateSaveString(): string {
        // Generate a save string in the form of [base level]-[word 0]-[word 1]-
        let str = this.baseLevelNumber.toString() + "-"
        for (let level of this.levels) {
            str += level.word + "-"
        }
        return str
    }

    updateURL() {
        // Save the current game to the url of the webpage
        let data = this.generateSaveString()
        //Save to the URL
        let currentUrl = window.location.href;
        currentUrl = currentUrl.match(/(.*?)\?/)?.[1] || currentUrl;
        history.pushState(null, "", `${currentUrl}?d=${data}`);
    }
}

function load_game(resetFlag: boolean, baseLevelOverride: number) {
    // create a Game object
    // Reset will clear the URL
    // If baseLevelOverride >= 0, change the base level
    let gameArea = document.getElementById("game-area") as HTMLDivElement
    removeDivChildren(gameArea)
    //Load the URL
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const parameterValue = urlParams.get('d');
    //Parse the Array
    let urlArray: Array<any>
    if (parameterValue === null || resetFlag === true) {
        //IF no URL or reset is toggled
        urlArray = ["0"]
    } else {
        urlArray = parameterValue.split("-")
    }
    // Create the game
    let levelNumber = parseInt(urlArray[0])
    if (baseLevelOverride >= 0) {
        levelNumber = baseLevelOverride
    }
    let game = new Game(gameArea, levelNumber)
    //Assign words from the URL
    for (let i = 1; i < urlArray.length; i++) {
        if (urlArray[i] === "") {
            continue
        }
        game.addWord(urlArray[i])
    }
    // Re-assign the buttons to the new game elements
    // Button to allow the user to set the base level
    let numberSetButton = document.getElementById('number-button') as HTMLImageElement
    numberSetButton.onclick = () => {
        //Replace the word HTML
        let numberResponse = prompt('Input the correct base level:')
        if (numberResponse === null || numberResponse === "") {
            //Do nothing, user canceled the input
            return
        } else {
            numberResponse = encodeURIComponent(numberResponse)
            if (/^\d+$/.test(numberResponse) && parseInt(numberResponse) >= 0) {
                //Valid input
                load_game(false, parseInt(numberResponse))
            }
        }
    }
    // Undo last word button
    let undoButton = document.getElementById('undo-button') as HTMLImageElement
    undoButton.onclick = () => {
        game.removeWord()
    }
    // Reset entire game button
    let resetButton = document.getElementById('reset-button') as HTMLImageElement
    resetButton.onclick = () => {
        load_game(true, -1)
    }

}

async function main() {
    //Create the dictionary
    dictionary = await load_file_json2(baseURL + "words_dictionary.json")
    // Create the game
    load_game(false, -1)
}

main()
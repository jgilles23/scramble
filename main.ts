
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
let outside = "hello"


interface WordAnalysis {
    word: string
    wordLength: number //Length of the word
    previousWord: string
    valid: boolean //Is this a valid word
    matchCount: number //Number of matching letters in new vs old word
    wordMatch: Array<boolean> // boolean array for each letter, true if matches previous word
    letters: Array<number> // All unique letters in the word
    matchLetters: Array<number> //letters in the new word that match the old word
    skipLetters: Array<number> //letters in the previous word that are not used
    newLetters: Array<number> //letters in the new word that are not in the previous word

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

function compareWords(word: string, previousWord: string): WordAnalysis {
    // Analyizes the newWord aganist the old word and creats a wordanalysis objkect
    // Object contains info about the comparison of the two words
    const analysis: WordAnalysis = {
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
    return analysis
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
    expanded: false

    constructor(game:Game, level: number) {
        // Build an empty level object (has the add word button)
        this.game = game
        this.level = level
        this.expanded = false
        
    }
}

// Main script for scramble car game
class Level {
    levelNumberDiv: HTMLDivElement
    levelArrowDiv: HTMLDivElement
    wordDiv: HTMLDivElement
    expansionDiv: HTMLDivElement
    previousLevel: Level | undefined
    nextLevel: Level | undefined
    //Properties that are used in calculations
    level: number
    word: string | undefined
    expanded: boolean

    constructor(previousLevel: Level | undefined) {
        //Create a word on the word list --- use the functions below to set to add a word
        //Link to other words & highlight letters / count statistics
        this.previousLevel = previousLevel;
        if (this.previousLevel !== undefined) {
            this.previousLevel.nextLevel = this
            this.level = this.previousLevel.level + 1
        } else {
            this.level = 0
        }
        this.nextLevel = undefined;
        //Set other paramters
        this.expanded = true;
        //Find the main div element to place under
        const gameAreaDiv = document.getElementById("game-area") as HTMLDivElement
        const levelAreaDiv = createDiv(gameAreaDiv, "", "")
        //Create the top line
        const levelTopLineDiv = createDiv(levelAreaDiv, "level-top-line", "")
        this.levelNumberDiv = createDiv(levelTopLineDiv, "letter", "-") //Level Number -- added in "update"
        this.levelNumberDiv.onclick = () => {
            if (this.nextLevel === undefined) {
                this.promptChangeLevel()
            }
        }
        this.levelArrowDiv = createDiv(levelTopLineDiv, "letter", ">")
        this.levelArrowDiv.style.backgroundColor = "white"
        this.levelArrowDiv.onclick = () => {
            this.expanded = !this.expanded
            this.update()
        }
        this.wordDiv = createDiv(levelTopLineDiv, "word", "")
        this.wordDiv.onclick = () => {
            if (this.nextLevel === undefined || this.nextLevel.word === undefined) {
                this.promptReplaceWord() //Add onclick for the word area
            }
        }
        //Create the expanded area
        this.expansionDiv = createDiv(levelAreaDiv, "expanded-level", "start test")
        //Update
        this.update()
    }

    update() {
        //Update the elements of the Level to show correctly given how the properties of the word have been set
        this.levelNumberDiv.textContent = this.level.toString()
        //Check if should be expanded
        if (this.word === undefined) {
            this.expanded = false
        }
        //Need to update the expansion arrow
        if (this.expanded === true) {
            this.levelArrowDiv.textContent = "v"
            this.expansionDiv.style.display = "block"
        } else {
            this.levelArrowDiv.textContent = ">"
            this.expansionDiv.style.display = "none"
        }
        //Remove the children of the word
        removeDivChildren(this.wordDiv)
        //Check if the word is undefined --- ending analysis
        if (this.word === undefined) {
            //IF there is no word, only put the add word button
            const addWordDiv = createDiv(this.wordDiv, "add-word-button", "add word")
            this.expansionDiv.innerHTML = "" //Clear the expansion
            // Reset the color of the number
            this.levelNumberDiv.style.backgroundColor = "lightgrey"
        } else {
            //Analyize the word
            let analysis: WordAnalysis
            if (this.previousLevel === undefined || this.previousLevel.word === undefined) {
                analysis = compareWords(this.word, "")
            } else {
                analysis = compareWords(this.word, this.previousLevel.word)
            }
            //Function to determine if the word is successful
            let successfulWord: boolean = this.level <= analysis.matchCount
            if (this.previousLevel === undefined && analysis.wordLength >= this.level) {
                successfulWord = true
            }
            //Special case where the previous word is exactly the length needed (or shorter)
            if (this.previousLevel !== undefined && this.previousLevel.word !== undefined && this.previousLevel.word.length <= analysis.matchCount) {
                successfulWord = true
            }
            //If word is shorter than the level always fails
            if (this.word !== undefined && this.word.length < this.level) {
                successfulWord = false
            }
            //Update the color of the word
            if (successfulWord === true && analysis.valid === true) {
                this.levelNumberDiv.style.backgroundColor = "forestgreen"
            } else {
                this.levelNumberDiv.style.backgroundColor = "red"
            }
            //Build the letters
            for (let i = 0; i < this.word.length; i++) {
                let letterDiv = createDiv(this.wordDiv, "letter", this.word[i])
                if (analysis.wordMatch[i] === true) {
                    letterDiv.style.backgroundColor = "RoyalBlue"
                } else if (this.nextLevel === undefined || this.nextLevel.word === undefined) {
                    letterDiv.style.backgroundColor = "lightgray"
                } else {
                    letterDiv.style.backgroundColor = "darkgrey"
                }
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
            //Build the expansion
            this.expansionDiv.innerHTML = ""
            if (successfulWord === false) {
                this.expansionDiv.innerHTML += "<span class='expanded-error'>word does not match enough letters</span><br>"
            }
            if (analysis.valid === false) {
                this.expansionDiv.innerHTML += "<span class='expanded-error'>word is not in the dictionary</span><br>"
            }
            this.expansionDiv.innerHTML += `
        matches: ${analysis.matchCount}<br>
        skipped letters: ${multiplicationString(analysis.skipLetters)}<br>
        word length: ${analysis.wordLength}<br>
        letter counts: ${multiplicationString(analysis.letters)}`
        }
        //Ensure the URL is updated --- probably calling this more times than required
        this.updateURL()
    }

    promptReplaceWord() {
        //Replace the word HTML
        let wordRespone = prompt('Input a new word:')
        if (wordRespone === null) {
            //Do nothing, user canceled the input
            return
        } else if (wordRespone === "") {
            //Do nothing, user did not submit a word
            return
        } else {
            wordRespone = wordRespone.replace(/\s/g, "")
            wordRespone = encodeURIComponent(wordRespone)
            wordRespone = wordRespone.toUpperCase()
            if (/^[a-zA-Z]+$/.test(wordRespone)) {
                //Valid input
                this.replaceWord(wordRespone)
            } else {
                //Invalid input try again
                this.promptReplaceWord()
                return
            }
        }
    }

    replaceWord(word: string | undefined) {
        if (this.word === "") {
            this.word = undefined
        } else {
            this.word = word
        }
        //Expand by default
        this.expanded = true
        this.update()
        //IF the next word does not yet exist, add it
        if (this.word !== undefined && this.nextLevel === undefined) {
            new Level(this)
            // Minimize the previous levels
            if (this.previousLevel !== undefined) {
                this.previousLevel.minimizeLevels()
            }
        }
    }

    promptChangeLevel() {
        //Replace the word HTML
        let numberResponse = prompt('Input the correct level:')
        if (numberResponse === null || numberResponse === "") {
            //Do nothing, user canceled the input
            return
        } else {
            numberResponse = encodeURIComponent(numberResponse)
            if (/^\d+$/.test(numberResponse)) {
                //Valid input
                this.changeLevel(parseInt(numberResponse))
            } else {
                //Invalid input try again
                this.promptChangeLevel()
                return
            }
        }
    }

    changeLevel(newLevel: number) {
        //Change the level of the current word & propigate up and down
        this.level = newLevel
        this.update()
        //Update previous level
        if (this.previousLevel !== undefined) {
            this.previousLevel.changeLevel(this.level - 1)
        }
    }

    minimizeLevels() {
        // Minimize this level and each level below
        this.expanded = false
        this.update()
        //update previous levels
        if (this.previousLevel !== undefined) {
            this.previousLevel.minimizeLevels()
        }
    }

    getRoot(): Level {
        //Find the root of the levels, return
        if (this.previousLevel === undefined) {
            return this
        } else {
            return this.previousLevel.getRoot()
        }
    }

    getTail(): Level {
        //Find the tail of the levels, return
        if (this.nextLevel === undefined) {
            return this
        } else {
            return this.nextLevel.getTail()
        }
    }

    getWordsRecursiveDown(): Array<string> {
        let wordList: Array<string>
        if (this.nextLevel === undefined) {
            wordList = []
        } else {
            wordList = this.nextLevel.getWordsRecursiveDown()
        }
        if (this.word === undefined) {
            return wordList
        } else {
            wordList.unshift(this.word)
            return wordList
        }
    }

    updateURL() {
        //Update the URL of the page
        let wordArray = this.getRoot().getWordsRecursiveDown()
        let data = this.getRoot().level.toString() + "-" + wordArray.join("-")
        //Save to the URL
        let currentUrl = window.location.href;
        currentUrl = currentUrl.match(/(.*?)\?/)?.[1] || currentUrl;
        history.pushState(null, "", `${currentUrl}?d=${data}`);
    }

}

class Game {
    // Class for holding the current game and manipulating the current game
    levels: Array<Level>
    addWordLevel: Level
    baseLevelNumber: number
    gameDiv: HTMLDivElement
    constructor(gameDiv:HTMLDivElement) {
        //Create a class object for holding the game
        this.levels = []
        this.addWordLevel = new Level(undefined)
        this.baseLevelNumber = 0
        this.gameDiv = gameDiv
    }
    loadString(str:string) {
        // Load a string into the game --- stored in the d value
    }
    editWord() {
        // edit the most recent word on the levels list

    }
    addWord() {
        // Add a word to the game (add a level)

    }
    removeWord() {
        // Remove a word from the levels
    }

}

function load_game(resetFlag: boolean, undoFlag: boolean) {
    // Clear the current screen and load the game
    // Clear the game area
    // Reset will clear the URL
    // Undo flag will remove the last word added
    let gameArea = document.getElementById("game-area") as HTMLDivElement
    removeDivChildren(gameArea)
    //Load the URL
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const parameterValue = urlParams.get('d');
    console.log(parameterValue)
    //Parse the Array
    let urlArray: Array<any>
    if (parameterValue === null || resetFlag === true) {
        //IF no URL or reset is toggled
        urlArray = ["0"]
    } else {
        urlArray = parameterValue.split("-")
    }
    // If undo flag, remove the last word from the array
    if (undoFlag === true && urlArray.length > 1) {
        urlArray.pop()
    }
    // Create the first level
    let levelObject = new Level(undefined)
    //Assign the level
    let levelNumber = parseInt(urlArray[0]) as number
    levelObject.changeLevel(levelNumber)
    //Assign words from the URL
    for (let i = 1; i < urlArray.length; i++) {
        if (urlArray[i] === "") {
            continue
        }
        levelObject.replaceWord(urlArray[i])
        if (levelObject.nextLevel !== undefined) {
            levelObject = levelObject.nextLevel
        }
    }
}

async function main() {
    //Create the dictionary
    dictionary = await load_file_json2(baseURL + "words_dictionary.json")
    // Create the game
    load_game(false, false)
    // Create the buttons
    let undoButton = document.getElementById('undo-button') as HTMLImageElement
    undoButton.onclick = () => {
        load_game(false, true)
    }
    let resetButton = document.getElementById('reset-button') as HTMLImageElement
    resetButton.onclick = () => {
        load_game(true, false)
    }
}

main()
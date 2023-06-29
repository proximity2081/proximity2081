// Register the Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}


let quotes = [];
let texts = [];
let authors = [];
let urls = [];

let historyStack = [];
let historyStackPointer = -1; // needs to be -1 so that when the first quote is picked it becomes 0

let startTime, endTime;
let currentIndex;
let currentText = "";
let totalCharactersTyped = 0;
let errorCount = 0;
let typedText = "";
let startedTyping = false;
let previousTypedLength = 0;

let scores = [];

document.addEventListener("DOMContentLoaded", function() {
    const textDisplay = document.getElementById("text-display");
    const authorDisplay = document.getElementById("author-display");
    const textInput = document.getElementById("text-input");
    const statsWPM = document.getElementById("wpm-value");
    const statsAccuracy = document.getElementById("accuracy-value");
    const statsErrors = document.getElementById("errors-value");
    const statsTime = document.getElementById("time-value");
    const statsPreviousBtn = document.getElementById("previous-btn");
    const statsResetBtn = document.getElementById("reset-btn");
    const statsNextBtn = document.getElementById("next-btn");
    const loadingAnimation = document.getElementById("loading-animation");

    let numberOfBatches = 319;
    let firstQuotesBatchNumber = Math.floor(Math.random()*numberOfBatches);
    
    loadFirstQuotesBatch();

    for (let i = 0; i < numberOfBatches; i++) {
        if (i != firstQuotesBatchNumber) fetchAndAddQuotesBatch(i);
    }


    async function loadFirstQuotesBatch() {
        await fetchAndAddQuotesBatch(firstQuotesBatchNumber);
        initialize();
        loadingAnimation.style.display = "none";
    }
    
    async function fetchAndAddQuotesBatch(batchNumber) {
        let quotesFilename = "/quotes/quotes_"+batchNumber.toString()+".json";
        const response = await fetch(quotesFilename);
        const data = await response.json();
        data.forEach(podcast => {
            podcast["quotes"].forEach(quote => {
                let quoteCopy = {};
                quoteCopy["url"] = "https://www.youtube.com/watch?v="+podcast["id"]+"&t="+quote["time"];
                quoteCopy["author"] = podcast["title"];
                quoteCopy["quote"] = quote["text"];
                quotes.push(quoteCopy);
            });
        });
        console.log("Number of quotes: " + quotes.length.toString());
        texts = quotes.map(element => element["quote"]);
        authors = quotes.map(element => element["author"]);
        urls = quotes.map(element => element["url"]);
    }

    function updateText(index) {
        currentIndex = index;
        currentText = texts[index];
        textDisplay.textContent = currentText;
        authorDisplay.textContent = authors[index];
        authorDisplay.href = urls[index];
    }

    function getNewTextIndex() {
        let index;
        const maxIterations = 100;
        for (let i=0; i<maxIterations; i++) {
            index = Math.floor(Math.random()*texts.length);
            alreadyTyped = false;
            for (let j=0; j<scores.length; j++) {
                if (scores[j].text == texts[index]) {
                    alreadyTyped = true;
                    break;
                }
            }
            if (!alreadyTyped) {
                break;
            }
        }
        return index;
    }

    function generateNewQuote() {
        updateText(getNewTextIndex());
        historyStack.push(currentIndex);
    }

    function startTimer() {
        startTime = Date.now();
    }

    function endTimer() {
        endTime = Date.now();
    }

    function getTimeDelta() {
        endTimer();
        return endTime - startTime;
    }

    function getCPM() {
        const elapsedTimeInMinutes = getTimeDelta() / 60000;
        let numberOfCorrectCharactersTyped = typedText.length;
        for (let i=0; i<typedText.length; i++) {
            if (typedText[i] != currentText[i]) {
                numberOfCorrectCharactersTyped = i;
                break;
            }
        }
        return numberOfCorrectCharactersTyped / elapsedTimeInMinutes;
    }

    function getAccuracy() {
        return (1 - (errorCount / totalCharactersTyped)) * 100;
    }

    function updateStats() {
        if (!startedTyping) return;
        const charactersPerMinute = getCPM();
        const wordsPerMinute = Math.round(charactersPerMinute / 5); // Assumes the average word length is 5 characters
        const accuracy = getAccuracy();
        const millisecondsElapsed = getTimeDelta();
        const secondsElapsed = Math.floor(millisecondsElapsed / 1000);

        statsWPM.textContent = wordsPerMinute;
        statsWPM.title = Math.round(charactersPerMinute) + " CPM";
        statsAccuracy.textContent = Math.round(accuracy) + "%";
        statsAccuracy.title = Math.round(accuracy*100)/100 + "%";
        statsErrors.textContent = errorCount;
        statsTime.textContent = secondsElapsed + " s";
        statsTime.title = millisecondsElapsed + " ms"
    }

    function checkInput() {
        typedText = textInput.value;

        if (typedText.length > previousTypedLength) {
            totalCharactersTyped++;
        }

        let correctText = currentText.substr(0, typedText.length);

        if (!startedTyping) {
            startTimer();
            startedTyping = true;
        }

        if (typedText === currentText) {
            saveScore();
            startedTyping = false;
            next();
        } else {
            if (typedText === correctText) {
                textInput.classList.remove("error");
            } else {
                textInput.classList.add("error");
                if (typedText.length > previousTypedLength) {
                    errorCount++;
                }
            }

        }
        previousTypedLength = typedText.length;
    }

    function previous() {
        if (historyStackPointer > 0) updateText(historyStack[--historyStackPointer]);
        reset();
    }

    function next() {
        historyStackPointer++;
        if (historyStackPointer >= historyStack.length) generateNewQuote();
        else updateText(historyStack[historyStackPointer]);
        reset();
    }

    function reset() {
        startTime = null;
        endTime = null;
        totalCharactersTyped = 0;
        errorCount = 0;
        typedText = "";
        startedTyping = false
        previousTypedLength = 0;

        textInput.value = "";
        textInput.focus();

        textInput.classList.remove("error");
    }

    function resetStats() {
        statsWPM.textContent = "0";
        statsAccuracy.textContent = "0%";
        statsErrors.textContent = "0";
    }

    function saveScore() {
        scores.push({"text": currentText, "cpm": getCPM(), "accuracy": getAccuracy()});
    }

    function initialize() {
        setInterval(updateStats, 500);
        textInput.addEventListener("input", checkInput);
        statsPreviousBtn.addEventListener("click", previous);
        statsResetBtn.addEventListener("click", reset);
        statsNextBtn.addEventListener("click", next);
        next();
    }
});

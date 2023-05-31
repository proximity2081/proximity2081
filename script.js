document.addEventListener("DOMContentLoaded", function() {
    const textDisplay = document.getElementById("text-display");
    const authorDisplay = document.getElementById("author-display");
    const textInput = document.getElementById("text-input");
    const statsWPM = document.getElementById("wpm-value");
    const statsAccuracy = document.getElementById("accuracy-value");
    const statsErrors = document.getElementById("errors-value");
    const statsResetBtn = document.getElementById("reset-btn");
    const statsNextBtn = document.getElementById("next-btn");

    let startTime, endTime;

    let textData = [];
    let texts = [];
    let authors = [];
    fetch("programming_quotes.json")
        .then(response => response.json())
        .then(data => {
            textData = data;
            texts = textData.map(element => element["quote"]);
            authors = textData.map(element => element["author"]);
            initialize();
        });

    let currentText = "";
    let totalCharactersTyped = 0;
    let errorCount = 0;
    let typedText = "";
    let startedTyping = false
    let previousTypedLength = 0;

    let scores = [];

    function changeText() {
        let index;
        for (let i=0; i<100; i++) {
            index = Math.floor(Math.random()*texts.length);
            alreadyTyped = false;
            for (let j=0; j<scores.length; j++) {
                if (scores[j].text==texts[index]) {
                    alreadyTyped = true;
                    break;
                }
            }
            if (!alreadyTyped) {
                break;
            }
        }
        currentText = texts[index];
        textDisplay.textContent = currentText;
        authorDisplay.textContent = authors[index];
    }

    function startTimer() {
        startTime = Date.now();
    }

    function endTimer() {
        endTime = Date.now();
    }

    function getCPM() {
        endTimer();
        const elapsedTimeInMinutes = (endTime - startTime) / 60000;
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
        return Math.round((1 - (errorCount / totalCharactersTyped)) * 100);
    }

    function updateStats() {
        if (!startedTyping) return;
        const charactersPerMinute = getCPM();
        const wordsPerMinute = Math.round(charactersPerMinute / 5); // Assumes the average word length is 5 characters
        const accuracy = getAccuracy();

        statsWPM.textContent = wordsPerMinute;
        statsWPM.title = Math.round(charactersPerMinute) + " CPM";
        statsAccuracy.textContent = accuracy + "%";
        statsErrors.textContent = errorCount;
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
            textInput.readOnly = true;
            setTimeout(function() {
                totalReset();
                textInput.readOnly = false;
            }, 1000);
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

    function totalReset() {
        changeText();
        reset();
    }

    function saveScore() {
        scores.push({"text": currentText, "cpm": getCPM(), "accuracy": getAccuracy()});
    }

    function initialize() {
        setInterval(updateStats, 100);
        textInput.addEventListener("input", checkInput);
        statsResetBtn.addEventListener("click", reset);
        statsNextBtn.addEventListener("click", totalReset);
        totalReset();
    }
});

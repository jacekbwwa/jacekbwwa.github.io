"use strict";

/* author Jacek Byzdra https://www.linkedin.com/in/jacek-byzdra/ */

const ROWNUMBERS = 10;
const PEGNUMBERS = 4;
const COLORS = ["red", "blue", "yellow", "green", "purple", "orange"];

class Attempts {
    static attempts = 0;
    static getAttempts() {
        return this.attempts;
    }
    static setAttempts(num) {
        this.attempts = num;
    }
}

class SelectedColor {
    static selectedColor = "";
    static getSelectedColor() {
        return this.selectedColor;
    }
    static setSelectedColor(code) {
        this.selectedColor = code;
    }
}

class SecretCode {
    static secretCode = [];
    static getSecretCode() {
        return this.secretCode;
    }
    static setSecretCode(code) {
        this.secretCode = code;
    }
}

class Game {
    static initializeGame() {
        SecretCode.setSecretCode(Action.generateSecretCode());
        Attempts.setAttempts(0);
        SelectedColor.setSelectedColor("");
        DisplayBoard.enableSubmitButton();
        DisplaySecretCode.hideSecretCode();
        DisplayBoard.renderColorSelection();
        DisplayBoard.renderBoard();
        document.getElementById("message").textContent = "Gues`s the secret code!";
        DisplayBoard.changeNumPegToRed(Number(Attempts.getAttempts()));
    }
}

class DisplayBoard {
    // render colorselection
    static renderColorSelection() {
        const colorselection = document.getElementById("colorselection");
        colorselection.innerHTML = "";

        const redbutton = document.createElement("button");
        redbutton.classList.add("colorsel");
        redbutton.style.backgroundColor = "red";
        redbutton.dataset.color = "red";

        const bluebutton = document.createElement("button");
        bluebutton.classList.add("colorsel");
        bluebutton.style.backgroundColor = "blue";
        bluebutton.dataset.color = "blue";

        const yellowbutton = document.createElement("button");
        yellowbutton.classList.add("colorsel");
        yellowbutton.style.backgroundColor = "yellow";
        yellowbutton.dataset.color = "yellow";

        const greenbutton = document.createElement("button");
        greenbutton.classList.add("colorsel");
        greenbutton.style.backgroundColor = "green";
        greenbutton.dataset.color = "green";

        const purplebutton = document.createElement("button");
        purplebutton.classList.add("colorsel");
        purplebutton.style.backgroundColor = "purple";
        purplebutton.dataset.color = "purple";

        const orangebutton = document.createElement("button");
        orangebutton.classList.add("colorsel");
        orangebutton.style.backgroundColor = "orange";
        orangebutton.dataset.color = "orange";

        colorselection.appendChild(redbutton);
        colorselection.appendChild(bluebutton);
        colorselection.appendChild(yellowbutton);
        colorselection.appendChild(greenbutton);
        colorselection.appendChild(purplebutton);
        colorselection.appendChild(orangebutton);
    }
    // render the board and input rows
    static renderBoard() {
        const board = document.getElementById("board");
        board.innerHTML = "";

        for (let i = 0; i < ROWNUMBERS; i++) {
            const row = document.createElement("div");
            row.classList.add("row");

            const numrow = document.createElement("div");
            numrow.classList.add("numrow");
            const numpeg = document.createElement("div");
            numpeg.classList.add("numpeg");
            numpeg.dataset.row = i;
            numpeg.setAttribute("id", i);
            numpeg.innerHTML = i + 1;
            numrow.appendChild(numpeg);
            row.appendChild(numrow);

            for (let j = 0; j < PEGNUMBERS; j++) {
                const peg = document.createElement("button");
                peg.classList.add("peg");
                peg.dataset.row = i;
                peg.dataset.col = j;
                peg.addEventListener("click", HandlePeg.selectPeg);
                row.appendChild(peg);
            }
            const keyRow = document.createElement("div");
            keyRow.classList.add("keyrow");
            for (let k = 0; k < PEGNUMBERS; k++) {
                const keyPeg = document.createElement("div");
                keyPeg.classList.add("keypeg");
                keyPeg.dataset.row = i;
                keyPeg.dataset.col = k;
                keyRow.appendChild(keyPeg);
            }

            row.appendChild(keyRow);
            board.appendChild(row);
        }
    }

    // disable board after game over
    static disableBoard() {
        document.querySelectorAll(".peg").forEach((peg) => {
            peg.removeEventListener("click", HandlePeg.selectPeg);
        });
    }
    
    //disable submit button
    static disableSubmitButton(){
        let beta = document.getElementById("submitguess");
        beta.disabled =true;
    }
    
        //enable submit button
    static enableSubmitButton(){
        let gamma = document.getElementById("submitguess");
        gamma.disabled =false;
    }

    //disable pegs in row
    static disablePegsInRow(num) {
        document.querySelectorAll(".peg").forEach((peg) => {
            if (Number(peg.dataset.row) === Number(num)) {
                peg.removeEventListener("click", HandlePeg.selectPeg);
                peg.disabled = true;
            }
        });
    }

    //change color of numpeg to red
    static changeNumPegToRed(num) {
        let alpha = document.getElementById(num);
        alpha.style.color = "red";
        alpha.style.fontWeight = "bold";
    }

    //change color of numpeg to black
    static changeNumPegToBlack(num) {
        let alpha = document.getElementById(num);
        alpha.style.color = "black";
        alpha.style.fontWeight = "";
    }
}

class DisplaySecretCode{
   static renderSecretCode(){
       const secretcodeboard = document.getElementById("secretcode");
       secretcodeboard.innerHTML = "";
       const secretcoderow = document.createElement("div");
        secretcoderow.classList.add("secretcoderow");
       const secretcodemessage = document.createElement("div");
       secretcodemessage.innerHTML="secret code: ";
       secretcoderow.appendChild(secretcodemessage);
       for (let k = 0; k < PEGNUMBERS; k++) {
                const secretcodepeg = document.createElement("div");
                secretcodepeg.classList.add("secretcodepeg");
                secretcodepeg.dataset.row = k;
                secretcodepeg.style.backgroundColor=SecretCode.getSecretCode()[k];
                secretcoderow.appendChild(secretcodepeg);
            }
       secretcodeboard.appendChild(secretcoderow);
   }
    
    static hideSecretCode(){
        const secretcodeboard = document.getElementById("secretcode");
        secretcodeboard.innerHTML="";
    }
}

class HandlePeg{
    // handle peg and color selection for pegs
    static selectPeg(event) {
        const peg = event.target;
        peg.style.backgroundColor = SelectedColor.getSelectedColor();
    }
}

class Action {
    // generate a random secret code
    static generateSecretCode() {
        return Array.from({ length: PEGNUMBERS }, () => {
            return COLORS[Math.floor(Math.random() * COLORS.length)];
        });
    }
}

class GuessEstimate {
    // evaluate and getObtainedTips of guessed color and index of secretCode
    static getObtainedTips(guess) {
        let redQty = 0;
        let blackQty = 0;
        const secretCodeCopy = [...SecretCode.getSecretCode()];
        const guessCodeCopy = [...guess];

        // count blacks keypegs - matched both color and index of pegs
        guess.forEach((color, index) => {
            if (color === SecretCode.getSecretCode()[index]) {
                blackQty++;
                secretCodeCopy[index] = null; // remove matched color from secretCodeCopy Array
                guessCodeCopy[index] = null; // remove matched color  from GuessCopy Array - prevent double counting
            }
        });

        // count reds keypegs - only matched color of pegs
        guessCodeCopy.forEach((color) => {
            if (color && secretCodeCopy.includes(color)) {
                redQty++;
                secretCodeCopy[secretCodeCopy.indexOf(color)] = null; // Remove matched color from secretCodeCopy Array - prevent double counting
            }
        });

        return { red: redQty, black: blackQty };
    }

    // render obtained tips for a guess
    static renderObtainedTips(obtainedTips) {
        const keyPegs = document.querySelectorAll(".keypeg");
        const startIndex = Number(Attempts.getAttempts()) * PEGNUMBERS;
        for (let i = 0; i < obtainedTips.black; i++) {
            keyPegs[startIndex + i].style.backgroundColor = "black";
        }
        for (let i = obtainedTips.black; i < obtainedTips.black + obtainedTips.red; i++) {
            keyPegs[startIndex + i].style.backgroundColor = "red";
        }
    }
}

class HandleGuess {
    // submit guess and provide obtainedTips
    static submitGuess() {
        const guess = Array.from(document.querySelectorAll(".peg"))
            .slice(Number(Attempts.getAttempts()) * PEGNUMBERS, (Number(Attempts.getAttempts()) + 1) * PEGNUMBERS)
            .map((peg) => peg.style.backgroundColor);

        const obtainedTips = GuessEstimate.getObtainedTips(guess);
        GuessEstimate.renderObtainedTips(obtainedTips);
        DisplayBoard.disablePegsInRow(Number(Attempts.getAttempts()));
        DisplayBoard.changeNumPegToBlack(Number(Attempts.getAttempts()));
        Attempts.setAttempts(Number(Attempts.getAttempts()) + 1);
        if (Number(Attempts.getAttempts()) < 10 && obtainedTips.black !== PEGNUMBERS) {
            DisplayBoard.changeNumPegToRed(Number(Attempts.getAttempts()));
        }

        if (obtainedTips.black === PEGNUMBERS) {
            document.getElementById("message").textContent = "You guessed the code! You win!";
            DisplaySecretCode.renderSecretCode();
            DisplayBoard.disableSubmitButton();
            DisplayBoard.disableBoard();
        } else if (Number(Attempts.getAttempts()) >= ROWNUMBERS) {
            document.getElementById("message").textContent =
                `Game over! The secret code was ${SecretCode.getSecretCode().join(", ")}.`;
            DisplaySecretCode.renderSecretCode();
            DisplayBoard.disableSubmitButton();
            DisplayBoard.disableBoard();
        }
    }
}

export { 
ROWNUMBERS, 
PEGNUMBERS,
COLORS,
Attempts,
SelectedColor,
SecretCode,
Game,
DisplayBoard,
Action,
GuessEstimate,
HandleGuess,
HandlePeg,
DisplaySecretCode
};

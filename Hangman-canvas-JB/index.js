var canvas;

function draw() {
	canvas = document.getElementById('canvasH');
	context = canvas.getContext("2d");
	canvas.width = canvas.width;
	drawGallows();
	drawHead();
}

function reset() {
	window.location.reload();
}

function clearCanvas() {
	canvas.width = canvas.width;
};


function setColor(color) {
	context.strokeStyle = color;
};

function setLineWidth(width) {
	context.lineWidth = width;
}

function drawGallows() {
	context.beginPath();
	context.moveTo(240, 430); //horizontal bottom right
	context.lineTo(50, 430); //vertical down
	context.lineTo(50, 60); //vertical up
	context.lineTo(180, 60);
	context.lineTo(180, 100);
	context.lineWidth = 4;
	setColor(getRandomColor());
	context.stroke();
};

function drawHead() {
	context.beginPath();
	context.arc(180, 150, 50, 0, Math.PI * 2, true);
	context.closePath();
	context.lineWidth = 4;
	setColor(getRandomColor());
	context.stroke();
};

function drawBody() {
	context.beginPath();
	context.moveTo(180, 200);
	context.lineTo(180, 300);
	setColor(getRandomColor());
	context.stroke();
};

function drawRightHand() {
	context.beginPath();
	context.moveTo(180, 220);
	context.lineTo(130, 300);
	context.stroke();
};

function drawLeftHand() {
	context.beginPath();
	context.moveTo(180, 220);
	context.lineTo(230, 300);
	context.stroke();
};

function drawRightFoot() {
	context.beginPath();
	context.moveTo(180, 300);
	context.lineTo(130, 400);
	context.stroke();
};

function drawLeftFoot() {
	context.beginPath();
	context.moveTo(180, 300);
	context.lineTo(230, 400);
	context.stroke();
};

function drawFace() {
	context.beginPath();
	context.arc(155, 140, 7, 0, Math.PI * 2, true);
	context.closePath();
	context.lineWidth = 2;
	setColor(getRandomColor());
	context.stroke();

	context.beginPath();
	context.arc(205, 140, 7, 0, Math.PI * 2, true);
	context.closePath();
	context.lineWidth = 2;
	context.stroke();

	context.beginPath();
	context.arc(155, 140, 3, 0, Math.PI * 2, true);
	context.closePath();
	context.lineWidth = 2;
	setColor(getRandomColor());
	context.stroke();

	context.beginPath();
	context.arc(205, 140, 3, 0, Math.PI * 2, true);
	context.closePath();
	context.lineWidth = 2;
	context.stroke();

	context.beginPath();
	context.moveTo(180, 145);
	context.lineTo(180, 160);
	setColor(getRandomColor());
	context.stroke();

	context.beginPath();
	context.lineWidth = 2;
	context.lineCap = 'round';
	context.beginPath();
	context.moveTo(155, 160);
	context.quadraticCurveTo(175, 195, 205, 160);
	setColor(getRandomColor());
	context.stroke();
};

function drawHair() {
	context.beginPath();
	context.moveTo(180, 100);
	context.lineTo(135, 135);
	setColor(getRandomColor());
	context.stroke();

	context.beginPath();
	context.moveTo(180, 100);
	context.lineTo(225, 135);
	context.stroke();

	context.beginPath();
	context.lineWidth = 2;
	context.lineCap = 'round';
	context.beginPath();
	context.moveTo(180, 100);
	context.quadraticCurveTo(175, 125, 135, 135);
	setColor(getRandomColor());
	context.stroke();

	context.beginPath();
	context.lineWidth = 2;
	context.lineCap = 'round';
	context.beginPath();
	context.moveTo(180, 100);
	context.quadraticCurveTo(185, 125, 225, 135);
	context.stroke();
}

function writeEnd() {
	context.beginPath();
	context.moveTo(50, 40);
	context.font = "italic 0.75em Verdana";
	context.fillStyle = "blue";
	context.textAlign = "start";
	context.fillText('created by Jacek Byzdra', 50, 40);
	context.textAlign = "end";
	context.stroke();
}


function getArrayWords(cb) {
	cb(['programming', 'violoncello', 'selection', 'repetition',
	'serendipity', 'performance', 'computing', 'America', 'Africa', 'adjective',
	'although', 'another', 'croquet', 'commitment', 'duplex', 'azure', 'exodus',
	'curriculum', 'hyphen', 'ivory', 'addressee', 'jigsaw', 'jockey', 'joyful',
	'kilobyte', 'luxury', 'microwave', 'nowadays', 'oxygen', 'quorum', 'sphinx',
	'subway', 'swivel', 'walkway', 'wizard', 'neutral', 'ivy', 'unknown', 'Europe',
	'college'])
}

function getRandomWord(cb) {
	getArrayWords(anArrayWords => {

		const randomWord = anArrayWords[Math.floor(Math.random() * 40)];
		cb(randomWord.toLowerCase());

	})
}

function getUnderscores(word) {
	var t = '_';
	var len = word.length;
	var Underscores = [];
	for (var i = 0; i < len; i++) {
		Underscores.push(t);
	}
	return Underscores;
}

function getUnderscoresWithGuessedChar(word, lettersUsed) {

	var t = '_';
	var hiddenWordWithUnderscores = getUnderscores(word);
	if (word.length > 0) {
		for (var j = 0; j < lettersUsed.length; j++) {
			for (var i = 0; i < hiddenWordWithUnderscores.length; i++) {
				if (word[i] == lettersUsed[j]) {
					hiddenWordWithUnderscores[i] = word[i];
				}
			}
		}
	}
	return hiddenWordWithUnderscores;
}

function splitStringToArray(str) {
	var arry = str.split('');
	arry.join('');
	return arry;
}

function sortBubbleArray(ar) {
	var k;
	for (var z = 0; z < ar.length - 1; z++) {
		for (var s = 0; s < ar.length - 1 - z; s++) {
			if (ar[s] > ar[s + 1]) {
				k = ar[s + 1];
				ar[s + 1] = ar[s];
				ar[s] = k;
			}
		}
	}
	return ar;
}

function removedDubbledEl(array) {
	var arp = [];
	for (var i = 0; i < array.length; i++) {
		if (arp.indexOf(array[i]) === -1) {
			arp.push(array[i]);

		}
	}
	return arp;
}

function nLivesRemaining(word, lettersUsed) {
	var counter = 0;
	var nLives = 8;
	var kr = "";
	var arr = splitStringToArray(word);
	sortBubbleArray(arr);
	var zf = removedDubbledEl(arr);
	for (var i = 0; i < zf.length; i++) {
		for (var j = 0; j < lettersUsed.length; j++) {
			if (lettersUsed[j] == zf[i]) {
				counter++;
			}
		}
	}
	nLives = nLives - (lettersUsed.length - counter);
	return nLives;
}

function checkIfGameWon(word, lettersUsed) {
	var counter = 0;
	for (var i = 0; i < word.length; i++) {
		for (var j = 0; j < lettersUsed.length; j++) {
			if (word[i] == lettersUsed[j]) {
				counter++;
			}
		}
	}
	if (counter == word.length) {
		return true;
	}
	return false;
}


function checkIfGameOver(word, lettersUsed) {
	if (nLivesRemaining(word, lettersUsed) == 0 && !checkIfGameWon(word, lettersUsed)) {
		return true;
	}
	return false;

}

function checkIfStillPlaying(word, lettersUsed) {
	if (nLivesRemaining(word, lettersUsed) > 0 && !checkIfGameWon(word, lettersUsed)) {
		return !checkIfGameWon(word, lettersUsed) && !checkIfGameOver(word, lettersUsed);
	}

	return false;
}


function displayStatus(word, lettersUsed) {
	var gstatus = document.getElementById('gamest');
	gstatus.value = " ";
	if (checkIfGameWon(word, lettersUsed)) {
		gstatus.value = "Congratulation ! You won the game!";
	} else if (!checkIfStillPlaying(word, lettersUsed) && !checkIfGameWon(word, lettersUsed)) {
		gstatus.value = "Sorry you lost the game. " + "\n" + "The word was: " + word;
	} else if (checkIfGameOver(word, lettersUsed)) {
		gstatus.value = "Game is Over! Bye!";
	} else {
		display(word, lettersUsed);
	}
}

function display(word, lettersUsed) {
	var dispnlives = document.getElementById('livesout');
	var dispunderscoredword = document.getElementById('worhidden');
	var lettsin = document.getElementById('lettersin');
	dispunderscoredword.value = " ";
	lettsin.value = " ";
	var hiddenWordWithUnderscores = getUnderscoresWithGuessedChar(word, lettersUsed);
	var nLives = nLivesRemaining(word, lettersUsed);
	dispnlives.value = nLives;
	var wordundersc = "";
	for (var i = 0; i < hiddenWordWithUnderscores.length; i++) {
		wordundersc = wordundersc + hiddenWordWithUnderscores[i] + " ";
	}
	dispunderscoredword.value = wordundersc;
	var letts = "";
	for (var i = 0; i < lettersUsed.length; i++) {
		letts = letts + lettersUsed[i] + ", ";
		if (i < (lettersUsed.length - 1)) {
			letts = letts + lettersUsed[i];
		}
	}
	lettsin.value = lettersUsed;
}


function isInputValueRepeated(inputletter, lettersUsed) {
	if (((inputletter >= 'A' && inputletter <= 'Z') || (inputletter >= 'a' && inputletter <= 'z')) && lettersUsed.length > 0) {
		for (var i = 0; i < lettersUsed.length; i++) {
			if (inputletter == lettersUsed[i]) {
				return true;
			}
		}
		return false;
	}
	return false;

}

function isInputValueInAlphabet(inputletter) {
	if ((inputletter >= 'A' && inputletter <= 'Z') || (inputletter >= 'a' && inputletter <= 'z')) {
		return true;
	}
	return false;
}

function getRandomColor() {
	var letters = "0123456789ABCDEF";
	var colors = '#';
	for (var i = 0; i < 6; i++) {
		colors += letters[Math.floor(Math.random() * 16)];
	}
	return colors;
}



function playGame(word, lettersUsed, inputletter) {
	display(word, lettersUsed);
	var charinp = document.getElementById('charin');
	var z = inputletter;
	charinp.value = z;
	var dspgst = document.getElementById('gamest');
	if (checkIfStillPlaying(word, lettersUsed)) {
		dspgst.value = "Still playing";
	} else if (!checkIfStillPlaying(word, lettersUsed)) {
		charinp.value = "";
		dspgst.value = "Playing Over!";
		displayStatus(word, lettersUsed);
		document.getElementById("input1").disabled = true;
	}
	var nlr = nLivesRemaining(word, lettersUsed);
	console.log(nlr);
	switch (nlr) {
		case 7:
			draw();
			break;
		case 6:
			drawFace();
			break;
		case 5:
			drawHair();
			break;
		case 4:
			drawBody();
			break;
		case 3:
			drawRightHand();
			break;
		case 2:
			drawLeftHand();
			break;
		case 1:
			drawRightFoot();
			break;
		case 0:
			drawLeftFoot();
			writeEnd();
			break;
		default:
			break;
	}

}

getRandomWord(word => {
	var lettersUsed = "";
	display(word, lettersUsed);
	var inp = document.getElementById('input1');
	inp.value = "";
	var gmst = document.getElementById('gamest');
	document.addEventListener('keyup', event => {
		event.preventDefault();
		event.stopPropagation()
		var inputletter = String.fromCharCode(event.keyCode).toLowerCase();
		if (isInputValueRepeated(inputletter, lettersUsed)) {
			gmst.value = "You have already entered the letter: " + inputletter;
		} else if (!isInputValueInAlphabet(inputletter)) {
			gmst.value = inputletter + " is not valid letter. " + "  Use letter from Alphabet!";
		} else {
			lettersUsed = lettersUsed + inputletter;
			playGame(word, lettersUsed, inputletter);
		}

	});


});

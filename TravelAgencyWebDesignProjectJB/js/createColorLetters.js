function createLettersAndChangeCollors3() {
	var tex3 = "Tatra Travel will help you book your dream holiday in mountains!!!";
	var color3 = 'hsl(100, 100%, 50%)';
	var numCol = Math.ceil(260 / tex3.length);
	var hueCol = 10 + (2 * numCol);
	var contextEntryDivNode3 = document.getElementById("contextEntryDivPanelA2Text");
	var contextEntryh2Node3 = document.createElement("h2");
	contextEntryh2Node3.classList = "h2PanelA2Text";


	var splitInp3 = tex3.split("");
	splitInp3.forEach(function (letter) {
		hueCol += numCol;
		if (hueCol > 360) {
			hueCol = 100 + numCol;;
		}
		if (hueCol > 190 & hueCol < 200) {
			hueCol += 25;
		}
		var letterColor3 = 'hsl(' + hueCol + ', 100%, 50%)';
		var contextEntrySpanNode3 = document.createElement("span");
		contextEntrySpanNode3.style.color = letterColor3;
		contextEntrySpanNode3.textContent += letter;
		contextEntryh2Node3.appendChild(contextEntrySpanNode3);

	})

	contextEntryDivNode3.appendChild(contextEntryh2Node3);

}

createLettersAndChangeCollors3();

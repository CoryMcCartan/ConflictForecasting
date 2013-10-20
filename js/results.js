/**
 * Create the results summary.
 */
function createResultsSummary() {
	var finalResult = round(game.weightedMeanAverage * 100, 1); // round the scaled result to 1 decimal place
	if (visible("section#scale")) { // use scale if scale section is visible
		$("section#resultsSummary > div").html("Final Result:  <b>" + getLabelMatch(finalResult) + "</b> (" + finalResult + ")");
	} else {
		$("section#resultsSummary > div").html("Final Result:  <b>" + finalResult + "</b>");
	}
	
	var vetoes = game.vetoes.length;
	if (vetoes > 0) { // someone vetoed
		var results = $("section#resultsSummary > div")[0];
		results.innerHTML += "<br /><br /><b>Agreement vetoed by:</b>"; //list header
		
		var list = document.createElement("ul");
		for (var i = 0; i < vetoes; i++) {
			var item = document.createElement("li");
			item.innerHTML = game.vetoes[i]; // player name
			list.appendChild(item); // add to list
		}
		
		results.appendChild(list); // add list to results
		if (currentFile.defaultResult !== -1) { // default result set
			if (visible("section#scale")) { // use scale if scale section is visible
				var label = getLabelMatch(currentFile.defaultResult);
				results.innerHTML += "<br /><b>Actual Agreement: </b>" + label + " (" + currentFile.defaultResult + ")";
			} else {
				results.innerHTML += "<br /><b>Actual Agreement: </b>" + currentFile.defaultResult;
			}
		}
	}
}

/**
 * A snapshot of the current iteration.
 */
function Snapshot() {
	this.weightedMeanAverage = game.weightedMeanAverage;
	this.playerPositions = new Array(game.N);
	
	for (var i in game.players) {
		this.playerPositions[i] = game.players[i].position;
	}
}

/**
 * Gets the label that matches the position.
 * @param {Number} position
 * @returns {string} the matching label
 */
function getLabelMatch(position) {
	var label = ""; // final label
	var bestDistance = Number.POSITIVE_INFINITY; // smaller is better
	for (var point in currentFile.scale) {
		var distance = Math.abs(position - point); // get distance
		if (distance < bestDistance) { // new record
			bestDistance = distance; // update best distacne
			label = currentFile.scale[point]; // get the label
		}
	}
	
	return label;
}
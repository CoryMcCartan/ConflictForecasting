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

function createRoundByRoundPositions() {
	var container = document.createElement("div");
		container.style.overflowX = "auto";
		container.style.width = "100%";
	var table = document.createElement("table");
		table.className = "roundByRound";
		table.style.width = "calc(" + 4 * (length(game.snapshots) + 1) + "em + 232px)"; // 4 em per column plus 240px for first column
	table.insertRow(-1).insertCell(-1).innerHTML = "Round:"; // upper-left  cell
	
	for (var i in game.players) { // names
		var row = table.insertRow(-1);
		var cell = row.insertCell(-1);
		cell.innerHTML = game.players[i].name;
	}
	for (var round in game.snapshots) {
		var rowID = 0;
		table.rows[0].insertCell(-1).innerHTML = parseInt(round) + 1; // round ID + 1 (round IDS start at 0) 
		for (var i in game.players) { // names
			var position = game.snapshots[round].playerPositions[i];
			position = roundFix(100 * position, 1); // scale and round
			table.rows[++rowID].insertCell(-1).innerHTML = position; // player positions
		}
	}
	
	container.appendChild(table);
	
	$("section#roundByRound > div")[0].innerHTML = container.outerHTML; // insert table
}

function createForecastGraph() {
	var dataLength = length(game.snapshots) + 1;
	var array = new Array(dataLength);
	array[0] = ["Round", "Forecast"];
	var ticks = new Array(dataLength - 1);
	for (var i = 1; i < dataLength; i++) {
		var forecast = game.snapshots[i - 1].weightedMeanAverage;
		forecast = round(100 * forecast, 2);
		array[i] = [i, forecast];
		ticks[i - 1] = i;
	}
	var data = google.visualization.arrayToDataTable(array);

	var inchesCF = parseInt($("div.page").css("width")) / 8.5;

	var options = {
		width: inchesCF * 7.5,
		height: inchesCF * 4,
		chartArea:{left: 56, top: 24, width: "75%", height: "85%"},
		vAxis: {minValue: 0, maxValue: 100, title: "Policy Position"},
		hAxis: {ticks: ticks, title: "Bargaining Round", format: "##"},
		fontName: "Libre Baskerville",
		colors: ["#c00"],
		lineWidth: 3
	};

  var chart = new google.visualization.LineChart(document.querySelector("section#forecastGraph > div"));
  chart.draw(data, options);
}

/**
 * A snapshot of the current iteration.
 */
function Snapshot() {
	this.weightedMeanAverage = game.weightedMeanAverage;
	this.medianPosition = game.medianPosition;
	this.risk = game.risk;
	this.expectedUtilities = game.expectedUtilities;
	this.probabilities = game.probabilities;
	
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
	var bestDistance = Infinity; // smaller is better
	for (var point in currentFile.scale) {
		var distance = Math.abs(position - point); // get distance
		if (distance < bestDistance) { // new record
			bestDistance = distance; // update best distacne
			label = currentFile.scale[point]; // get the label
		}
	}
	
	return label;
}
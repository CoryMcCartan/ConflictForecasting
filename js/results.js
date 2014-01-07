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
		if (currentFile.f.defaultResult !== -1) { // default result set
			if (visible("section#scale")) { // use scale if scale section is visible
				var label = getLabelMatch(currentFile.f.defaultResult);
				results.innerHTML += "<br /><b>Actual Agreement: </b>" + label + " (" + currentFile.f.defaultResult + ")";
			} else {
				results.innerHTML += "<br /><b>Actual Agreement: </b>" + currentFile.f.defaultResult;
			}
		}
	}
}

/**
 * Create the round-by-round data.
 */
function createRoundByRoundData() {
	var container = document.createElement("div");
		container.style.overflowX = "auto";
		container.style.width = "100%";
	var table = document.createElement("table");
		table.className = "roundByRound";
		table.style.width = "calc(" + 4 * (length(game.snapshots) + 1) + "em + 232px)"; // 4 em per column plus 240px for first column
	table.insertRow(0).insertCell(-1).innerHTML = "Bargaining Round:"; // upper-left  cell
	table.insertRow(1).insertCell(-1).innerHTML = "<i>FORECAST</i>"; // upper-left  cell
	
	for (var i in game.players) { // names
		var row = table.insertRow(-1);
		var cell = row.insertCell(-1);
		cell.innerHTML = game.players[i].name;
	}
	for (var round in game.snapshots) {
		var rowID = 0;
		table.rows[0].insertCell(-1).innerHTML = parseInt(round) + 1; // round ID + 1 (round IDS start at 0) 
		table.rows[++rowID].insertCell(-1).innerHTML = roundFix(100 * game.snapshots[round].weightedMeanAverage, 2); // round ID + 1 (round IDS start at 0) 
		for (var i in game.players) { // names
			var position = game.snapshots[round].playerPositions[i];
			position = roundFix(100 * position, 2); // scale and round
			table.rows[++rowID].insertCell(-1).innerHTML = position; // player positions
		}
	}
	
	container.appendChild(table);
	
	$("section#roundByRound > div")[0].innerHTML = container.outerHTML; // insert table
}

/**
 * Create the forecast graph.
 */
function createForecastGraph() {
	var dataLength = length(game.snapshots);
	
	var data = [
		{
			label: "Median Position", 
			data: [],
			color: "#777",
			highlightColor: "#AAA"
		},
		{
			label: "Weighted Mean", 
			data: [],
			color: "#D00",
			highlightColor: "#F00",
			lines: {lineWidth: 4}
		}
	];
	for (var i = 0; i < dataLength; i++) {
		var snapshot = game.snapshots[i];
		data[0].data[i] = [i, 100 * snapshot.medianPosition];
		data[1].data[i] = [i, 100 * snapshot.weightedMeanAverage];
	}
	
	var options = {
		series: {
			lines: { 
				show: true, 
				fill: false
			},
			points: {
				show: true,
				fill: true
			},
			shadowSize: 0
		},
		yaxis: {
			min: 0,
			max: 110,
			tickSize: 10,
			reserveSpace: true,
			tickFormatter: function(val, axis) { return val < axis.max ? val : "Position";}
		},
		xaxis: {
			tickSize: 1,
			min: 0,
			max: dataLength,
			tickFormatter: function(val, axis) { return val < axis.max ? val : "Round";}
		},
		grid: { hoverable: true }
	};

	var element = $("#graph");
	
	window.graph = $.plot(element, data, options);
}

/**
 * Create cost benefit analysis.
 */
function createCostBenefitAnalysis() {
	var html = document.createElement("span");
	var label = document.createTextNode("Players:");
	var list1 = document.createElement("select");
		list1.id = "A";
	$(html).on("change", "select", function() {
		var A = $("select#A").get(0).selectedOptions[0].getAttribute("playerID"); // selected player ID
		var B = $("select#B").get(0).selectedOptions[0].getAttribute("playerID"); // selected player ID
		if (A === B) return;
		
		var graph = GraphElement();
		$("div#cbGraph").html(graph);
		drawCostBenefitGraph(A, B, graph);
	});
		
	for (var ID in game.players) {
		var option = document.createElement("option");
		option.innerHTML = game.players[ID].name;
		option.setAttribute("playerID", ID);
		list1.appendChild(option);
	}
	var divG = document.createElement("div");
		divG.id = "cbGraph";
	var list2 = list1.cloneNode();
		list2.id = "B";
	var button = document.createElement("button");
		button.innerHTML = "Add to Page";
		button.className = "red";
		button.onclick = function() {
			var A = $("select#A").get(0).selectedOptions[0].getAttribute("playerID"); // selected player ID
			var B = $("select#B").get(0).selectedOptions[0].getAttribute("playerID"); // selected player ID
			if (A === B) return;
			
			var div = document.createElement("div");
			var graph = GraphElement();
			var deleteButton = document.createElement("button");
			deleteButton.innerHTML = "-";
			deleteButton.className = "deleteScale";
			deleteButton.onclick = function() {
				$(div).remove();
				if ($("#cost-benefit div").html() === "") { // hide section if empty
					setState("#cost-benefit", false);
				}
			};
			var title = document.createElement("span");
				title.innerHTML = game.players[A].name + " and " + game.players[B].name;
				title.style.fontWeight = "bold";
				title.style.textAlign = "center";
				title.style.width = "6in";
				title.style.display = "inline-block";
			var label = document.createTextNode("Delete");
			
			div.appendChild(title);
			div.appendChild(label);
			div.appendChild(deleteButton);
			div.appendChild(graph);
			
			$("section#cost-benefit > div").append(div);
			setState("#cost-benefit", true);
			
			drawCostBenefitGraph(A, B, graph);
		};
	
	
	html.appendChild(label);
	html.appendChild(document.createElement("br"));
	html.appendChild(list1);
	html.appendChild(document.createElement("br"));
	html.appendChild(list2);
	html.appendChild(divG);
	html.appendChild(document.createElement("br"));
	html.appendChild(button);
	
	dialog("OK", "Cost-Benefit Analysis", html, function() { }, 640);
}

/**
 * Create cost benefit graph.
 */
function drawCostBenefitGraph(A, B, element) {
	var dataLength = length(game.snapshots);
	var playerA = game.players[A];
	var playerB = game.players[B];
	
	var data = [
		{
			label: playerB.name + " challenges " + playerA.name, 
			data: [],
			color: "#27f",
			highlightColor: "#04f"
		},
		{
			label: playerA.name + " challenges " + playerB.name, 
			data: [],
			color: "#2f7",
			highlightColor: "#0f4"
		},
		{
			label: "Bargaining Advantage", 
			data: [],
			color: "#f44",
			highlightColor: "#f00"
		}
	];
	for (var i = 1; i < dataLength; i++) {
		var snapshot = game.snapshots[i];
		var utilityA = snapshot.expectedUtilities[A][B];
		var utilityB = snapshot.expectedUtilities[B][A];
		data[0].data[i] = [i, utilityB];
		data[1].data[i] = [i, utilityA];
		data[2].data[i] = [i, utilityA - utilityB];
	}
	
	var options = {
		series: {
			lines: { 
				show: true, 
				fill: false
			},
			points: {
				show: true,
				fill: true
			},
			shadowSize: 0
		},
		yaxis: {
			reserveSpace: true,
			tickFormatter: function(val, axis) { return val < axis.max ? val.toFixed(1) : "Utility";}
		},
		xaxis: {
			tickSize: 1,
			max: dataLength,
			tickFormatter: function(val, axis) { return val < axis.max ? val : "Round";}
		},
		grid: { hoverable: true }
	};
	
	$.plot(element, data, options);
}

function GraphElement() {
	var element  = document.createElement("div");
	element.style.width = "640px";
	element.style.height = "320px";
	element.style.position = "relative";
	element.style.fontFamily = "Libre Baskerville";
	
	return element;
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
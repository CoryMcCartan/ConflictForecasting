function runForecast() {
	if (length(currentFile.players) === 0) { // no players, no data, no forecast
		dialog("OK", "Error", "No players added.");
		return;
	}
	
	window.game = {};
	game.players = duplicate(currentFile.players);
	game.N = length(players);
	game.weightedMeanAverage = weightedMeanAverage();
	game.snapshots = [];
	game.vetoes = [];
	
	checkVeto();
	
	createResultsSummary();
	
	dialog("OK","","Forecast Completed.");
}

/**
 * Calculate the Weighted Mean Average
 * The WMA is the position weighted by the product of salience and influence
 * @returns {Number} the weighted mean average
 */
function weightedMeanAverage() {
	var weightedPositionSum = 0;
	var weightSum = 0;
	for (var i in game.players) {
		var weight = game.players[i].salience * game.players[i].influence; // weight is the product of salience and influence
		weightedPositionSum += weight * game.players[i].position; // weight the position
		weightSum += weight; // add up the weights
	}
	
	return weightedPositionSum / weightSum;
}


function solveDecisionTree() {
	
}

/**
 * Check if players will veto the agreemetn
 */
function checkVeto() {
	for (var p in game.players) {
		var player = game.players[p];
		if (!game.players[p].veto) { // no veto power
			continue; // skip to next player
		}
		
		if (currentFile.defaultResult === -1) { // no default result
			var range = player.flexibility;
			if (Math.abs(player.position - game.weightedMeanAverage) > range) { // distance of value wanted from actual is greater than half flexibility
				game.vetoes.push(player.name);
			}
		} else { // default result
			var withoutVeto = Math.abs(player.position - game.weightedMeanAverage);
			var withVeto = Math.abs(player.position - currentFile.defaultResult / 100);
			if (withVeto < withoutVeto) { // vetoing brings outcome closer to what the player wants
				game.vetoes.push(player.name);
			}
		}
	}
}
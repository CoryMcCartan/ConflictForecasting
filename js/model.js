/**
 * Run forecast
 */
function runForecast() {
	if (length(currentFile.f.players) === 0) { // no players, no data, no forecast
		dialog("OK", "Error", "No players added.");
		return;
	}
	
	window.game = {};
	game.players = duplicate(currentFile.f.players);
	game.N = length(game.players);
	game.weightedMeanAverage = weightedMeanAverage();
	game.medianPosition = calculateMedianPosition();
	game.snapshots = {0: new Snapshot()}; // save initial data
	game.vetoes = [];
	game.round = 1;
	
	do {
		game.risk = createGameArray(1, 1); // 1D array with 1.0 as default value
		// calculate once using risk = 1
		game.utilities = calculateBasicUtilities();
		game.probabilities = calculateProbabilities();
		game.expectedUtilities = calculateExpectedUtilities();
		game.risk = calculateRisk();
		// Re-calculate using newly calculated risk
		game.utilities = calculateBasicUtilities();
		game.probabilities = calculateProbabilities();
		game.expectedUtilities = calculateExpectedUtilities();
		
		game.offers = makeOffers();
		calculateNewPositions();
		if (currentFile.f.shockSalience !== -1) {
			randomlyShockSalience();
		}
		
		game.weightedMeanAverage = weightedMeanAverage();
		game.medianPosition = calculateMedianPosition();
		
		game.snapshots[game.round] = new Snapshot(); // save round data
		game.round++; // increment round
	} while(!gameEnded()) // while game is still going
	
	checkVeto();
	createResultsSummary();
	createRoundByRoundData();
	createForecastGraph();
	
	dialog("OK","","Forecast Completed.", function() {
		if (currentFile.f.shockSalience === -1) {
			$("control-tab[title~=Page]")[0].$S("#title").click(); // open page tab
		}
	});
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
/**
 * Calculate pairwise votes
 */
function calculateMedianPosition() {
	// PAIRWISE VOTES
	var votes = createGameArray(2); // 2D array
	for (var j in game.players) { // when comparing player J
		var playerJ = game.players[j];
		for (var k in game.players) { // and other player k
			if (j === k) continue; // can't be same two players (J and K)
			var playerK = game.players[k];
			
			var sum = 0;
			for (var i in game.players) { // vote cast by each player I
				if (i === j || i === k) continue; // can't be same two players (I and J or I and K)
				var playerI = game.players[i];
				
				var weight = playerI.influence * playerI.salience;
				var diffJ = Math.abs(playerI.position - playerJ.position);
				var diffK = Math.abs(playerI.position - playerK.position);
				sum += weight * (diffK - diffJ);
			}
			
			votes[j][k] = sum; // sum of votes vote for j relative to k
		}
	}
	
	// CONDORCET SUMS
	var mostVotes = -Infinity; // most number of votes 
	var winnerID = -1; // which player got most number of votes
	var condorcetSums = createGameArray(1, 0);
	for (var i in game.players) {
		var condorcetSum = 0;
		for (var j in game.players) {
			if (i === j) continue; // i and j can't be same
			condorcetSums[i] += votes[i][j]; // sum up votes for i relative to all others
		}
		
		if (condorcetSums[i] > mostVotes) { // 
			mostVotes = condorcetSum; // update highest value
			winnerID = i; // save ID of current condorcet winner
		}
	}
	
	return game.players[winnerID].position; // the position of the player with the most votes is the median
}

/**
 * Calculate utilities for challenging, compromising, status quo, etc.
 */
function calculateBasicUtilities() {
	var template = {success: 0, failure: 0, statusQuo: 0, better: 0, worse: 0};
	var utilities = createGameArray(2, template); // pairwise 2D array with template as default value
	
	for (var i in game.players) {
		var playerI = game.players[i];
		
		for (var j in game.players) {
			if (i === j) continue; // I and J can't be same player
			var playerJ = game.players[j];
			
			var diffIJ = Math.abs(playerI.position - playerJ.position); // distance between I and J
			var diffIM = Math.abs(playerI.position - game.medianPosition); // distance between I and M, the median
			var risk = game.risk[i]; // I's risk exponent
			
			utilities[i][j].success = 2 - 4 * Math.pow(0.5 - 0.5 * diffIJ, risk);
			utilities[i][j].failure = 2 - 4 * Math.pow(0.5 + 0.5 * diffIJ, risk);
			utilities[i][j].better = 2 - 4 * Math.pow(0.5 - 0.25 * (diffIM + diffIJ), risk);
			utilities[i][j].worse = 2 - 4 * Math.pow(0.5 + 0.25 * (diffIM + diffIJ), risk);
			utilities[i][j].statusQuo = 2 - 4 * Math.pow(0.5, risk);
		}
	}
	
	return utilities;
}

/**
 * Calculate probabilities of winning conflicts
 */
function calculateProbabilities() {
	var probabilities = createGameArray(2); // 2D array
	
	for (var i in game.players) { // player I challenges 
		var playerI = game.players[i];
		
		for (var j in game.players) { // player J is challenged by
			if (i === j) continue; // I and J can't be same player
			var playerJ = game.players[j];
			
			if (playerJ.position === playerI.position) { // both agree
				probabilities[i][j] = 0; // no point in challenging
				continue; // save computation and lots of NaN
			}
			
			var sumAll = 0; // sum of all players
			var sumPositive = 0; // sum of all players with arg. > 0
			for (var k in game.players) {
				if (i === k || j === k) continue; // I and K and J can't be same player
				var playerK = game.players[k];
				
				var weight = playerK.influence * playerK.salience;
				var diffJ = Math.abs(playerK.position - playerJ.position);
				var diffI = Math.abs(playerK.position - playerI.position);
				var arg = weight * (diffJ - diffI);
				
				sumAll += Math.abs(arg); // keep everything positive
				if (arg > 0) {
					sumPositive += arg;
				}
			}
			
			probabilities[i][j] = sumPositive / sumAll;
		}
	}
	
	return probabilities;
}

/**
 * Calculate expected challenge utilities
 */
function calculateExpectedUtilities() {
	var expectedUtilities = createGameArray(2); // 2D array
	var probabilities = game.probabilities;
	var utilities = game.utilities;
	
	for (var i in game.players) { // player I challenges 
		var playerI = game.players[i];
		
		for (var j in game.players) { // player J is challenged by
			if (i === j) continue; // I and J can't be same player
			var playerJ = game.players[j];
			
			var utilitiesI = utilities[i][j];
			var Q = 1 - playerJ.flexibility;
			var T = (Math.abs(playerI.position - game.medianPosition) < Math.abs(playerI.position - playerJ.position)) ? 1 : 0; //  T = 1 if J's move helps I
			
			var challenge = playerJ.salience * (probabilities[i][j] * utilitiesI.success + (1 - probabilities[i][j]) * utilitiesI.failure)
					+ (1 - playerJ.salience) * utilitiesI.success;
			var noChallenge = Q * utilitiesI.statusQuo 
					+ (1 - Q) * (T * utilitiesI.better + (1 - T) * utilitiesI.worse);
			
			expectedUtilities[i][j] = challenge - noChallenge;
		}
	}
	
	return expectedUtilities;
}

/**
 * Calculate risk exponents
 */
function calculateRisk() {
	var utilitySums = createGameArray(1); // 1D array
	var rawRisk = createGameArray(1); // 1D array
	var scaledRisk = createGameArray(1); // 1D array
	
	// utility sums
	var max = -Infinity;
	var min = Infinity;
	for (var i in game.players) { // player I challenges 
		var sum = 0;
		
		for (var j in game.players) { // player J is challenged by
			if (i === j) continue; // I and J can't be same player
			
			sum += game.expectedUtilities[i][j];
		}
		
		if (sum > max) max = sum;
		if (sum < min) min = sum;
		
		utilitySums[i] = sum;
	}
	
	// RISK
	for (var i in game.players) { // player I challenges 
		rawRisk[i] = (2 * utilitySums[i] - max - min) / (max - min);
	}
	
	// scale risk
	for (var i in game.players) { // player I challenges 
		var risk = rawRisk[i];
		scaledRisk[i] = (1 - risk / 3) / (1 + risk / 3);
	}
	
	return scaledRisk;
}

/**
 * Make offers between players
 */
function makeOffers() {
	var offers = createGameArray(2, "NONE"); // 2D array, default no offer
	
	for (var i in game.players) { // I makes offer to J, but stored in offers[j][i] to create list of all offers J gets
		for (var j in game.players) {
			if (i === j) continue; // I and J can't be same player
			var utilityI = game.expectedUtilities[i][j];
			var utilityJ = game.expectedUtilities[j][i];
			
			if (utilityI > 0) { // I will challenge J
				if (utilityJ > 0) { // J will challenge I as well
					if (utilityI > utilityJ) { // I has upper hand
						offers[j][i] = "Confrontation W"; // I will win
					} else {
						offers[j][i] = "Confrontation L"; // J will win
					}
				} else { // J won't challenge but I will
					if (utilityI > -utilityJ) { // J is not as weak as I is powerful
						offers[j][i] = "Compromise"; // J moves partway to I
					} else { // I is really powerful
						offers[j][i] = "Capitulate"; // J moves all the way to I
					}
				}
			}
		}
	}
	
	return offers;
}
/**
 * Calculate new positions based on offers
 */
function calculateNewPositions() {
	var newPositions = createGameArray(1); // 1D array of next round's positions
	for (var i in game.players) {
		var positionI = game.players[i].position;
		var template = {offer: "", newPosition: 0, enforceability: 0};
		var sortedOffers = createGameArray(1, template); // 1D array of offers with additional data
		
		// figure out new positions
		for (var j in game.offers[i]) {
			if (i === j) continue; // I can't make offer to itself
			var offer = game.offers[i][j]; // J's offer to I
			sortedOffers[j].offer = offer;
			if (offer === "NONE") continue; // don't worry about no offers
			
			var positionJ = game.players[j].position;
			var utilityI = game.expectedUtilities[i][j];
			var utilityJ = game.expectedUtilities[j][i];
			
			sortedOffers[j].enforceability = utilityJ;
			
			switch (offer) { // (J is I and I is J), see makeOffers()
				case "Confrontation W": // J will win
					sortedOffers[j].newPosition = positionJ;
					break;
				case "Confrontation L": // J will lose
					sortedOffers[j].newPosition = positionI;
					break;
				case "Compromise": // I moves partway to J
					sortedOffers[j].newPosition = positionJ + (positionI - positionJ) * Math.abs(utilityI / utilityJ);
					break;
				case "Capitulate": // I moves all the way to J
					sortedOffers[j].newPosition = positionJ;
					break;
			}
		}
		
		// choose offer
		var greatestUtility = 0;
			var mostEnforceableOffer = null;
		var smallestMove = 100;
			var bestOffer = null;
		for (var o in sortedOffers) {
			if (o === i) continue; // can't make offer to self
			var offer = sortedOffers[o];
			
			if (offer.enforceability > greatestUtility) { // this offer most enforceabel
				greatestUtility = offer.enforceability;
				mostEnforceableOffer = duplicate(offer); // just to be safe
			}
			
			if (Math.abs(positionI - offer.newPosition) < smallestMove) { // this offer best for player I
				smallestMove = Math.abs(positionI - offer.newPosition);
				bestOffer = duplicate(offer); // just to be safe
			}
		}
		
		if (mostEnforceableOffer === null) { // no offers
			newPositions[i] = positionI; // no change
		} else if (mostEnforceableOffer.enforceability / bestOffer.enforceability > 1.1) { // the bad but powerful offer is too powerful comparted to the best
			newPositions[i] = mostEnforceableOffer.newPosition;
		} else { // choose the one that is best for
			newPositions[i] = bestOffer.newPosition;
		}
	}
	
	// AFTER all new positions have been chosen, update positions
	for (var i in game.players) {
		game.players[i].position = newPositions[i];
	}
}

/**
 * Shock salience
 */
function randomlyShockSalience() {
	for (var i in game.players) {
		if (Math.random() > currentFile.f.shockSalience) { // yes, shock salience
			game.players[i].salience = round(Math.random(), 2); // random new value
		}
	}
}

/**
 * Check if game has ended
 * @returns {Boolean} if game has ended
 */
function gameEnded() {
	if (currentFile.f.forceLength !== -1) {
		if (game.round > currentFile.f.forceLength) {
			return true;
		} else {
			return false;
		}
	}
	var currentResult = game.snapshots[game.round - 1].weightedMeanAverage;
	var lastResult = game.snapshots[game.round - 2].weightedMeanAverage;
	if (Math.abs(lastResult - currentResult) < 0.01) { // 1% error
		return true;
	} else {
		return false;
	}
}

/**
 * Check if players will veto the agreemetn
 */
function checkVeto() {
	for (var p in game.players) {
		var player = currentFile.f.players[p]; // use original values
		if (!game.players[p].veto) { // no veto power
			continue; // skip to next player
		}
		
		if (currentFile.f.defaultResult === -1) { // no default result
			var range = player.flexibility;
			if (Math.abs(player.position - game.weightedMeanAverage) > range) { // distance of value wanted from actual is greater than half flexibility
				game.vetoes.push(player.name);
			}
		} else { // default result
			var withoutVeto = Math.abs(player.position - game.weightedMeanAverage);
			var withVeto = Math.abs(player.position - currentFile.f.defaultResult / 100);
			if (withVeto < withoutVeto) { // vetoing brings outcome closer to what the player wants
				game.vetoes.push(player.name);
			}
		}
	}
}
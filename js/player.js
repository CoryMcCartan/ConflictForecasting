/**
 * Create a player
 * @param {string} name
 * @param {number} position
 * @param {number} influence
 * @param {number} salience
 * @param {number} flexibility
 * @param {boolean} veto
 * @returns {Player} the player object
 */
function Player(name, position, influence, salience, flexibility, veto) {
	// set values, or use default
	this.name = name || Player.defaultValues.name;
	this.position = position || Player.defaultValues.position;
	this.influence = influence || Player.defaultValues.influence;
	this.salience = salience || Player.defaultValues.salience;
	this.flexibility = flexibility || Player.defaultValues.flexibility;
	this.veto = veto || (Player.defaultValues.veto === "Yes");
}
Player.defaultValues = {"name": "", "position": 0, "influence": 0, "salience": 0, "flexibility": 0, "veto": "No"}; // default values

/**
 * Generate Player ID
 */
function generatePlayerID() {
	return global.currentPlayerID++; // return and then increment the id
}

function shockSalience() {
	var icon = this.$S(".icon");
	if (!icon.className.match("off")) { // button is on
		var html = "Probability of shock (percentage): &nbsp;&nbsp;";
		html += "<input id='probability' type='number' min='0' max='100' step='0.5' value='50' />";
		
		dialog("OKC", "Shock Salience", html, function(response, root) {
			if (response === "OK") {
				var probability = root.querySelector("input#probability").value;
				icon.parentElement.querySelector(".label").innerHTML += " (" + probability + "%)"; // add percentage to label
				currentFile.shockSalience = parseFloat(probability) / 100; // parse as float and scale to a 0-1 range
			} else { // cancel
				getButton("Shock Salience").click();
			}
		});
	} else { // turned off
		currentFile.shockSalience = -1; // don't shock salience
		icon.parentElement.querySelector(".label").innerHTML = "Shock Salience"; // remove percentage from label
	}
}

function forceLength() {
	var icon = this.$S(".icon");
	if (!icon.className.match("off")) { // button is on
		var html = "Number of rounds: &nbsp;&nbsp;";
		html += "<input id='rounds' type='number' min='1' step='1' value='10' />";
		
		dialog("OKC", "Force Length", html, function(response, root) {
			if (response === "OK") { 
				var length = root.querySelector("input#rounds").value;
				icon.parentElement.querySelector(".label").innerHTML += " (" + length + ")"; // add length to label
				currentFile.forceLength = parseInt(length); // parse as int
			} else { // cancel
				getButton("Force Length").click()
			}
		});
	} else { // turned off
		currentFile.forceLength = -1; // don't force length
		icon.parentElement.querySelector(".label").innerHTML = "Force Length"; // remove length from label
	}
}
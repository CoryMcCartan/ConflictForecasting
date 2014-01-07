/**
 * After file has loaded, set flags, set up file, and start event handlers
 */
$(document).ready(function() { // when done AND loaded license
	var link = $('link[rel="import"]')[0];
	var template = link.import.querySelector("article");
	var css = link.import.querySelector("style").innerHTML;
	var templates = link.import.querySelectorAll("template");
	for (var i = 0; i < templates.length; i++) {
		templates[i].innerHTML = templates[i].innerHTML.replace("<style></style>", "<style>" + css + "</style>");
	}
	var content = template.cloneNode(true);
	$("body")[0].appendChild(content);
	templateSetup();
	
	storageGet("license", function(data) {
		$(".loading").fadeIn(0);
		setTimeout(load, 400); // force DOM refresh, causing page to white-out while scripts run.
		
		
		if (equals(data, {})) {
			var expirationDate = new Date();
			expirationDate.setDate(expirationDate.getDate() + 7);
			window.license = {name: "user", organization: "The United States of America", expiration: expirationDate};
			var html = "Name: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\n\
							<input id='name' type='text' /><br />Organization: &nbsp;<input id='org' type='text' />";
			dialog("OK", "Registration", html, function(response, root) {
				license.name = root.querySelector("#name").value;
				license.organization = root.querySelector("#org").value;
				if (licensedUser()) {
					license.expiration = "NEVER"; // never expires
					dialog("OK", "Registration Complete", "Welcome, " + license.name + ".", function() { });
				} else {
					dialog("OK", "Trial Version", "You are not a registered user.  The software will expire in a week.", function() { });
				}
				storageSet("license", JSON.stringify(license));
				
				
				$("software-license, watermark-label").html(function(index, old) {
					old = old.replace("user", window.license.name);
					old = old.replace("The United States of America", window.license.organization);
					return old;
				});
			});
		} else {
			window.license = JSON.parse(data.license);
			license.expiration = new Date(license.expiration); // parse date
			
			if (Date.now() > license.expiration) { // expired
				$("div.expired").css("display", "block");
				setTimeout(chrome.app.window.current().contentWindow.close, 5000); // close window in five seconds
			}
		}
		
		window.currentFile = new File();
		window.backupFile = duplicate(currentFile); // copy of what was saved last
		window.global = {
			hasBeenSaved: false, // has it ever been saved
			currentPlayerID: 0, // the player ID of the next player added
			selectedRowID: -1, // the row ID of the currently selected player (-1 means no one has been selected)
			selectedPlayerID: -1 // the player ID of the currently selected player (-1 means no one has been selected)
		};
	});
});

/** 
 * Set up event handlers
 */
function load() {
	document.querySelector("watermark-label").innerHTML += ", " + new Date().toLocaleDateString(); // add date to watermark
	$($("control-tab[title~=File]")[0].$S("#title")).click(); // set file tab as default
	$("software-license, watermark-label").html(function(index, old) {
		old = old.replace("$NAME$", window.license.name);
		old = old.replace("$ORGANIZATION$", window.license.organization);
		return old;
	});
	onresize = function() {
		$("div.content").css("height", innerHeight - 178 + "px");
	};
	onresize();
	
	// event handlers
	$(".title").bind("keyup blur", rename);
	$(".content").bind("mousedown", function() { // make table lose focus
		global.selectedPlayerID = -1;
		global.selectedRowID = -1;
	});
	$(document).bind("beforeunload", function() {
		if (global.hasBeenSaved) save();
	}); // save file on exit
	$("section#notes > div").bind("keyup", function() { 
		var text = $(this).html(); // get text
		text = text.replace(/--/g,"—"); // fix dashes
		currentFile.f.notes = text; // save
	}); // save notes
	$("section#notes > div").blur(function() {
		$(this).html(currentFile.f.notes); // fix dashes
	});
	$("select#scenarioSelect").change(changeScenario);
	$("#description").bind("keyup blur", function() {
		var name = $("select#scenarioSelect").get(0).selectedOptions[0].innerHTML; // get name of selected option
		currentFile.scenarios[name].description = this.innerHTML;
	});
	$("#deleteScenario").click(deleteScenario);
	// normal butotns
	getButton("New").click(newFile);
	getButton("Open").click(open);
	getButton("Save").click(save);
	getButton("Save As").click(saveAs);
	getButton("Manage Files").click(manageFiles);
	getButton("Delete File").click(deleteFile);
	getButton("Import").click(importFile);
	getButton("Share").click(share);
	getButton("Help").click(help);
	getButton("Add Player").click(addPlayer);
	getButton("Remove Player").click(removePlayer);
	getButton("Clear All").click(clearAll);
	getButton("New Scenario").click(newScenario);
	getButton("Default Result").click(setDefault);
	getButton("Create Scale Point").click(createScalePoint);
	getButton("Shock Salience").click(shockSalience);
	getButton("Force Length").click(forceLength);
	getButton("Run Forecast").click(runForecast);
	getButton("Print").click(function() {
		$("div.content").css("height", "");
		window.print();
		onresize();
	});
	// toggle buttons
	getButton("Player Table").click(function() { toggle("#playerTable"); });
	getButton("Results Summary").click(function() { toggle("#resultsSummary"); });
	getButton("New Cost-Benefit Analysis").click(function() { createCostBenefitAnalysis(); });
	getButton("Round-by-Round Data").click(function() { toggle("#roundByRound"); });
	getButton("Forecast Graph").click(function() { toggle("#forecastGraph"); createForecastGraph(); });
	getButton("Scale").click(function() { toggle("#scale"); });
	getButton("Notes").click(function() { toggle("#notes"); });
	
	$(".loading").fadeOut(500);
	
	// 0ms fast transition
	toggle("#scenario", 0);
	toggle("#resultsSummary", 0);
	toggle("#cost-benefit", 0);
	toggle("#roundByRound", 0);
	toggle("#forecastGraph", 0);
	toggle("#scale", 0);
	$("restore-button").hide();
}

/**
 * Checks to see if user is in database
 * @returns {boolean} true if licensed
 */
function licensedUser() {
	var registeredUsers = [
		{"name": "Cory McCartan", "organization": "Sammamish High School"}
	];
	
	var matches = $.grep(registeredUsers, function(user) {
		return (user.name === license.name && user.organization.toUpperCase() === license.organization.toUpperCase()); // perfect name match, organization match
	});
	
	return (matches.length === 1); // having only one maatch will result in OK, otherwise fraud
}

/**
 * Retrieve a button by its label
 * @param {string} label
 * @returns {HTMLElement} the button
 */
function getButton(label) {
	return $('tab-button, toggle-button').filter(function(index) { return $(this).text().toLowerCase() === label.toLowerCase(); });
}
/**
 * Enable a button
 * @param {string} label the button label
 */
function enableButton(label) {
	var button = $('tab-button, toggle-button').filter(function(index) { return $(this).text().toLowerCase() === label.toLowerCase(); });
	button.removeClass("disabled");
	$(button[0].$S(".button")).removeClass("disabled");
}
/**
 * Disable a button
 * @param {string} label the button label
 */
function disableButton(label) {
	var button = $('tab-button, toggle-button').filter(function(index) { return $(this).text().toLowerCase() === label.toLowerCase(); });
	button.addClass("disabled");
	$(button[0].$S(".button")).addClass("disabled");
}

/**
 * Gets whether an element is visible
 * @param {string} selector the selector
 * @returns {boolean}
 */
function visible(selector) {
	return !($(selector).css("display") === "none"); //if not "display:none" then visible
}

/**
 * Counts the number of values in an Object
 * @param {Object} object the object
 * @returns {Number} the number of values
 */
function length(object) {
	return Object.keys(object).length;
}

/**
 * Duplicate object, to prevent data linkage
 * @param {type} object
 * @returns {undefined} the duplicated copy
 */
function duplicate(object) {
	var copy = {};
	if (typeof object === "object" && object !== null) {
		for (var i in object) {
			var value = object[i];
			if (typeof value === "object") {
				value = duplicate(value); // recursive clone
			}
			copy[i] = value;
		}
		return copy;
	} else {
		return object;
	}
}

/**
 * Checks if two objects are equal
 * @param {type} objectA
 * @param {type} objectB
 * @returns {undefined} true if equal
 */
function equals(objectA, objectB) {
	return JSON.stringify(objectA) === JSON.stringify(objectB);
}

/**
 * Rounds a number
 * @param {Number} number the number
 * @param {Number} decimalPlaces the number of decimal places to round to
 * @returns {Number} the rounded number
 */
function round(number, decimalPlaces) {
	var factor = Math.pow(10, decimalPlaces);
	return Math.round(number * factor) / factor;
}
/**
 * Rounds a number, including trailing 0s
 * @param {Number} number the number
 * @param {Number} decimalPlaces the number of decimal places to round to
 * @returns {Number} the rounded number
 */
function roundFix(number, decimalPlaces) {
	var rounded =round(number, decimalPlaces);
	return rounded.toFixed(decimalPlaces);
}

/**
 * Sets a keyboard shortcut.
 * @param {string} combination the key combination
 * @param {function} callback the callback function
 */
function setKeyboardShortcut(combination, callback) {
	$(document).bind("keypress", combination, function(e) {
		e.preventDefault();
		callback();
		return false;
	});
}

/**
 * Text-select element contents
 * @param {type} el the element
 */
function selectElementContents(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

/**
 * Toggle selector visibility
 * @param {string} selector CSS selector to select element(s) to toggle
 * @param {Number} duration ms
 */
function toggle(selector, duration) {
	if (duration !== 0) duration = 200;
	var state = $(selector).css("opacity") === "0";
	$(selector).css("display", "block");
	setTimeout(function() { // small delay for proper display
		$(selector).css("opacity", state ? "1" : "0");
	}, 10);
	if (!state) {
		setTimeout(function() {
			$(selector).css("display", "none");
		}, duration);
	}
}

/**
 * Set selector visibility
 * @param {string} selector CSS selector to select element(s) to toggle
 * @param {boolean} state
 */
function setState(selector, state) {
	$(selector).css("display", state ? "block" : "none");
	setTimeout(function() { // small delay for proper display
		$(selector).css("opacity", state ? "1" : "0");
	}, 10);
}
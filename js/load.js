/**
 * After file has loaded, set flags, set up file, and start event handlers
 */
$(document).ready(function() {
	$("body *").fadeOut(0);
	$(".loading").fadeIn(150);
	setTimeout(load, 250); // force DOM refresh, causing page to white-out while scripts run.
	
	$.get("license.json", function(data) {
		window.license = JSON.parse(data);
	});
	window.currentFile = new File();
	window.backupFile = duplicate(currentFile); // copy of what was saved lsat
	window.global = {
		hasBeenSaved: false, // has it ever been saved
		currentPlayerID: 0, // the player ID of the next player added
		selectedRowID: -1, // the row ID of the currently selected player (-1 means no one has been selected)
		selectedPlayerID: -1 // the player ID of the currently selected player (-1 means no one has been selected)
	};
});

/** 
 * Set up event handlers
 */
function load() {
	document.querySelector("watermark-label").innerHTML += ", " + new Date().toLocaleDateString(); // add date to watermark
	$($("control-tab[title~=File]")[0].$S("#title")).click(); // set file tab as default
	$("software-license").html(function(index, old) {
		return old.replace("$NAME$", window.license.name);
	});
	
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
		currentFile.notes = text; // save
	}); // save notes
	$("section#notes > div").blur(function() {
		$(this).html(currentFile.notes); // fix dashes
	});
	$("close-button").click(function() {
		close();
	});
	$("maximize-button").click(function() {
		chrome.app.window.current().maximize();
		$("restore-button").show();
		$(this).hide();
	});
	$("restore-button").click(function() {
		chrome.app.window.current().restore();
		$("maximize-button").show();
		$(this).hide();
	});
	$("minimize-button").click(function() {
		chrome.app.window.current().minimize();
	});
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
	getButton("Create Scale Point").click(createScalePoint);
	getButton("Default Result").click(setDefault);
	getButton("Shock Salience").click(shockSalience);
	getButton("Force Length").click(forceLength);
	getButton("Run Forecast").click(runForecast);
	getButton("Print").click(function() {
		window.print();
	});
	// toggle buttons
	getButton("Player Table").click(function() { toggle("#playerTable"); });
	getButton("Results Summary").click(function() { toggle("#resultsSummary"); });
	getButton("Cost-Benefit Analysis").click(function() { toggle("#cost-benefit"); });
	getButton("Round-by-Round Positions").click(function() { toggle("#roundByRound"); });
	getButton("Forecast Graph").click(function() { toggle("#forecastGraph"); });
	getButton("Scale").click(function() { toggle("#scale"); });
	getButton("Notes").click(function() { toggle("#notes"); });
	
	$("body *").fadeIn(1750);
	$(".loading").fadeOut(500);
	
	// 0ms fast transition
	toggle("#resultsSummary", 0);
	toggle("#cost-benefit", 0);
	toggle("#roundByRound", 0);
	toggle("#forecastGraph", 0);
	toggle("#scale", 0);
	$("restore-button").hide();
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
	for (var i in object) {
		var value = object[i];
		if (typeof value === "object") {
			value = duplicate(value); // recursive clone
		}
		copy[i] = value;
	}
	return copy;
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
	if (duration === 0) { // not defined
		$(selector).toggle();
	} else {
		$(selector).toggle(175);
	}
}
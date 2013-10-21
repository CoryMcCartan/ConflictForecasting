/**
 * Set up the UI after a file has been opened
 */
function setUpFile() {
	// title
	$(".title").html(currentFile.name);
	// players
	var table = document.querySelector("table#players");
	var maxID = 0;
	for (var ID in currentFile.players) {
		var player = currentFile.players[ID];
		var tr = table.insertRow(-1); // add row at end
		tr.setAttribute("playerID", ID);
		addPlayerCells(tr); // set up event handlers, etc for all of the cells
		var index = 0;
		for (var parameter in Player.defaultValues) {
			var cell = tr.cells[index]; // get cell 
			var value = player[parameter]; // get value
			switch (parameter) { // format values
				case "name":
					cell.innerHTML = value; // put value in cell
					break;
				case "veto":
					value = value ? "Yes" : "No"; // replace T/F with Y/N
					cell.innerHTML = value; // put value in cell
					break;
				default:
					value *= 100; // put on 100-pt scale
					cell.innerHTML = value.toFixed(1); // round put value in cell
					break;
			}
			index++;
		}
		
		maxID = Math.max(ID, maxID); // update max. ID reached
	}
	global.currentPlayerID = maxID + 1;
	
	// shock salience and force length
	if (currentFile.shockSalience !== -1) { // shock salience
		var button = getButton("Shock Salience")[0]; // find button
		button.turnOn(); // turn on
		button.$S(".label").innerHTML += " (" + currentFile.shockSalience * 100 + "%)"; // add percentage to label
	} else { 
		var button = getButton("Shock Salience")[0]; // find button
		button.turnOff();
		button.$S(".label").innerHTML = "Shock Salience";
	}
	if (currentFile.forceLength !== -1) { // force length
		var button = getButton("Force Length")[0]; // find button
		button.turnOn(); // turn on
		button.$S(".label").innerHTML += " (" + currentFile.forceLength + ")"; // add length to label
	} else { 
		var button = getButton("Force Length")[0]; // find button
		button.turnOff();
		button.$S(".label").innerHTML = "Force Length";
	}
	if (currentFile.defaultResult !== -1) { // default result
		var button = getButton("Default Result")[0]; // find button
		button.turnOn(); // turn on
		button.$S(".label").innerHTML += " (" + currentFile.defaultResult + ")"; // add length to label
	} else { 
		var button = getButton("Default Result")[0]; // find button
		button.turnOff();
		button.$S(".label").innerHTML = "Default Result";
	}
	$("section#notes > div").html(currentFile.notes); // fill notes section
	if (length(currentFile.scale) > 0) { // fill in scale
		getButton("Scale")[0].turnOn(); // turn on button
		$("section#scale").show(); // show the section
		
		for (var position in currentFile.scale) {
			var point = createScalePoint();
			$(point).find("input#value").val(position); // fill with position value
			$(point).find("input#label").val(currentFile.scale[position]); // fill with label
		}
	}
	global.hasBeenSaved = true; // since we loaded the file from memory, it has already been saved to memory, obviously
	window.backupFile = duplicate(currentFile);
	
	$("control-tab[title~=Game]")[0].$S("#title").click(); // open game tab
}

/**
 * Creates row in table for player object
 * @returns {undefined}
 */
function addPlayer() {
	var table = document.querySelector("table#players");
	var tr = table.insertRow(-1); // add row at end
	var playerID = generatePlayerID();
	tr.setAttribute("playerID", playerID);
	var player = new Player();
	currentFile.players[playerID] = player;
	
	addPlayerCells(tr);
}

/**
 * Remove a player
 */
function removePlayer() {
	var rowID = global.selectedRowID; //  row ID of the player to be removed
	var playerID = global.selectedPlayerID; //  row ID of the player to be removed
	var rows = $("table#players tr");
	if (rowID === -1) { // nothing selected
		rowID = rows.length - 1; // the most recently added
		playerID = rows[rowID].getAttribute("playerID"); // the most recently added ID
	}
	rows[rowID].remove(); // delete row
	delete currentFile.players[playerID]; // delete player
	global.selectedPlayerID = -1;  // no one is selected
	global.selectedRowID = -1;  // no one is selected
}

/** 
 * Remove all players
 */
function clearAll() {
	dialog("YN", "Clear All", "Are you sure you would like to remove all players?", function(response) {
		if (response === "yes") {
			clearAllPlayers();
		}
	});
}

/**
 * Define the scale -- how position values correspond to actual policy decisions
 */
function createScalePoint() {
	getButton("Scale")[0].turnOn(); // turn on button
	$("section#scale").show(); // show the section
	
	var scalePoint = document.createElement("div"); // container element
		scalePoint.className = "scalePoint";
	var scaleValue = document.createElement("input"); // value of scale point
		scaleValue.id = "value";
		scaleValue.type = "number";
		scaleValue.min = "0";
		scaleValue.max = "100";
		scaleValue.value = "0";
		scaleValue.onkeyup = updateScale;
	/*	var labelV = document.createElement("label");
		labelV.innerHTML = "Position: "; */
	var scaleLabel = document.createElement("input"); // value of scale point
		scaleLabel.id = "label";
		scaleLabel.type = "text";
		scaleLabel.onkeyup = updateScale;
	/*	var labelL = document.createElement("label");
		labelL.innerHTML = "Label: "; */
	var deleteButton = document.createElement("button");
		deleteButton.innerHTML = "-";
		deleteButton.className = "deleteScale";
		deleteButton.onclick = function() {
			$(scalePoint).remove(); // remove the container element
			updateScale(); // update scale to notice removed element
		};
//	scalePoint.appendChild(labelV); // scaleValue label
	scalePoint.appendChild(scaleValue); // scaleValue element
//	scalePoint.appendChild(labelL); // scaleLabel label
	scalePoint.appendChild(scaleLabel); // scaleLabel element
	scalePoint.appendChild(deleteButton); // button to delte 
	
	$("section#scale > div")[0].appendChild(scalePoint);
	
	scaleValue.focus();
	
	return scalePoint; // for functions that want immediate access to values
}
/**
 * Update the scale values
 */
function updateScale() {
	currentFile.scale = {}; // clear for new values
	$("section#scale > div").find("div.scalePoint").each(function(index, element) {
		var position = parseFloat( $(element).find("input#value").val() ); // position value
		var label = $(element).find("input#label").val(); // label
		currentFile.scale[position] = label; // match position with label;
	});
}
/**
 * Set a default result
 */
function setDefault() {
	var icon = this.$S(".icon");
	
	if (!icon.className.match("off")) { // button is on
		var html = "Default Result: &nbsp;&nbsp;";
		html += "<input id='default' type='number' min='0' max='100' value='50' />";
		
		dialog("OKC", "Default Result", html, function(response, root) {
			if (response === "OK") { // OK
				currentFile.defaultResult = parseFloat( root.querySelector("input#default").value );
				getButton("Default Result")[0].$S(".label").innerHTML += " (" + currentFile.defaultResult + ")"; // add length to label
			} else { // cancel
				getButton("Default Result").click(); // make un-selected again
			}
		});
	} else { // turned off
		currentFile.defaultResult = -1; // don't have default result
		getButton("Default Result")[0].$S(".label").innerHTML = "Default Result";
	}
}

/**
 * Format the cells in the table and update corresponding player object values
 * @param {HTMLTableRowElement} td the table cell
 * @returns {undefined}
 */
function updateValues(td) {
	var playerID = td.parentElement.getAttribute("playerID"); // parent element is TD, get the stored player id attribute there
	var category = td.name; // the name attribute is the category -- influence, veto, etc
	var value = td.innerHTML.replace(/<br>/g,''); //remove accidental line breaks
	switch (category) { // format numbers
		case "name": 
			break;
		case "position":
			if (value > 100) value = 100;
			if (value < 0) value = 0;
			td.innerHTML = parseFloat(value).toFixed(1);  // if it went out of range, replace the value with the in-range one
			value /= 100; // scale down to 1
			break;
		case "influence":
			if (value > 100) value = 100;
			if (value < 0) value = 0;
			td.innerHTML = parseFloat(value).toFixed(1);  // if it went out of range, replace the value with the in-range one
			value /= 100; // scale down to 1
			break;
		case "salience":
			if (value > 100) value = 100;
			if (value < 0) value = 0;
			td.innerHTML = parseFloat(value).toFixed(1);  // if it went out of range, replace the value with the in-range one
			value /= 100; // scale down to 1
			break;
		case "flexibility":
			if (value > 100) value = 100;
			if (value < 0) value = 0;
			td.innerHTML = parseFloat(value).toFixed(1);  // if it went out of range, replace the value with the in-range one
			value /= 100; // scale down to 1
			break;
		case "veto":
			td.innerHTML = value[0].toUpperCase() + value.substring(1); // capitalize first letter
			value = (value.toLowerCase() === "yes"); 
			break;
	}
	var player = currentFile.players[playerID]; // get player frpm list
	player[category] = value; // set updated and formatted value
}

/**
 * Create player cells and set up event handlers
 * @param {type} row the table row to insert the cells
 */
function addPlayerCells(row) {
	for (var i in Player.defaultValues) { // for each cell we should add
		var td = row.insertCell(-1); // insert cell after all others
		td.name = i; // label the cell with the name of the property it holds -- influence, veto, ect.
		td.innerHTML = Player.defaultValues[i]; // fill with default values
		td.contentEditable = true; // label the cell with the name of the property it holds -- influence, veto, ect.
		td.onfocus = function() { // select text on focus
			selectElementContents(this);
			global.selectedRowID = this.parentElement.rowIndex; // get row ID of selected
			global.selectedPlayerID = this.parentElement.getAttribute("playerID"); //get playerID of selected
		};
		td.onblur = function() { // select text on focus
			updateValues(this); //format numbers and ranges
		};
		td.onmouseup = function(e) {
			e.preventDefault(); // don't undo text selection
		};
		td.onkeyup = function(e) { // arrow keys move
			var keyCode = e.keyCode;
			var row = this.parentElement.rowIndex; // row index of current row
			var rows = $('table#players tr').length - 1;
			var column = this.cellIndex;
			var columns = length(Player.defaultValues) - 1;
			if (keyCode === 38) { // up
				row--;
			} else if (keyCode === 40) { // down
				row++;
			} else if (keyCode === 37 
					&& window.getSelection().getRangeAt(0).startOffset === 0) { // left, and cursor is as far left as possible
				column--;
			} else if (keyCode === 39 
					&& window.getSelection().getRangeAt(0).startOffset === this.innerHTML.length) { // right, and cursor is as far right as possible
				column++;
			}
			if (row < 1) row = 1; // can't select header
			if (row > rows) row = rows; // can't select header
			if (column < 0) column = 1;
			if (column > columns) column = columns; // can't go past last column
			var newRow = $('table#players tr')[row];
			var newCell = newRow.children[column];
			newCell.focus();
		};
		
		if (i === "name") { 
			td.style.textAlign = "left"; // left-align name
			td.focus(); // set focus on first element
		}
	}
}

/**
 * Show help.
 */
function help() {
	window.location.assign("help.html"); // load help page
}


/**
 * Create a dialog box
 * @param {string} type the type -- "YNC" yes/no/cancel, "OKC" -- ok/cancel, "OK" -- ok
 * @param {string} title the title of the dialog
 * @param {string} content
 * @param {function} callback the callback function, parameters are "yes"/"no"/"OK"/"cancel" for button press, as well as array all elements
 */
function dialog(type, title, content, callback) {
	var dialog = document.createElement("dialog-box");
	dialog.setAttribute("type", type);
	if (typeof content === "string") {
		dialog.innerHTML = content; // set innerHTML to string
	} else { // HTML object given
		dialog.appendChild(content); // add HTML to element
	}
	dialog.title = title;
	dialog.done = callback || function() { };
	document.body.appendChild(dialog);
}
/**
 * Prototype/template object for dialog box
 */
var dialogPrototype = Object.create(HTMLElement.prototype);
	dialogPrototype.createdCallback = function() {
		var template = document.querySelector('#dialogtemplate'); // get template
		this.createShadowRoot().appendChild(template.content.cloneNode(true)); // fill custom element with template content

		var root = this;
		this.$S("#yes").onclick = function() { // 'return' true, remove dialog
			root.done("yes", root);
			$(root).remove();
		};
		this.$S("#no").onclick = function() { // 'return' false, remove dialog
			root.done("no", root);
			$(root).remove();
		};
		this.$S("#ok").onclick = function() { // 'return' true, remove dialog
			root.done("OK", root);
			$(root).remove();
		};
		this.$S("#cancel").onclick = function() { // 'return' false, remove dialog
			root.done("cancel", root);
			$(root).remove();
		};
	};
	dialogPrototype.attributeChangedCallback = function(attr) {
		if (attr !== "title") return; // wait for last expected change (the adding of the title)
		this.$S(".title").innerHTML = this.title; // get and set title
		if (this.title === "") { // if no title, remove title element
			this.$S(".title").remove();
		}
		var type = this.getAttribute("type");
		if (!type.match("Y")) { // no yes button
				this.$S("#yes").remove();
		}
		if (!type.match("N")) { // no no button
				this.$S("#no").remove();
		}
		if (!type.match("OK")) { // no OK button
				this.$S("#ok").remove();
		}
		if (!type.match("C")) { // no cancel button
				this.$S("#cancel").remove();
		}
	};
document.register('dialog-box', {prototype: dialogPrototype});
/**
 * Create a new file
 */
function newFile() {
	// checks if needs to be saved then proceeds
	checkSave(function() {
		clear();
	});
}

/**
 * Open a file
 */
function open() {
	// check if should be saved
	checkSave(function() {
		var files = generateFileList();
		// generate HTML list of files
		var list = document.createElement("ul");
		for (var i in files) {
			var item = document.createElement("li");
			item.innerHTML = i.substring(27); // get the file name (starts on character 27)
			item.className = "fileObject"; // for styling
			item.onclick = function() { // on click add class to show it's selected
				$("ul > li.fileObject").removeClass("selected");
				$(this).addClass("selected");
			};
			list.appendChild(item);
		}
		dialog("OKC", "Open File", list, function(response, root) {
			if (response === "OK") {
				var el = root.querySelector("ul > li.selected"); // the selected element
				if (el === null) { // nothing selected;
					return;
				}

				clear(); // clear file

				var name = el.innerHTML; // the selected file name
				currentFile = JSON.parse(storageGet(getFileKey(name))); // retrieve file and parse it into an object.
				setUpFile();
			}
		});
	});
}

/**
 * Save the current file.
 */
function save() {
	if (!global.hasBeenSaved) { // has never been saved
		saveAs();
	} else {
		saveFile();
	}
}

/**
 * Save the current file with a different name
 */
function saveAs() {
	dialog("OKC", "Save As", "File name: <input type='text' value='" 
			+ currentFile.name // auto-complete with current file title
			+ "' />", function(response, root) {
		if (response === "OK") { // OK pressed
			var fileName = root.querySelector("input").value;
			currentFile.fileName = fileName;
			saveFile();
		} else { } // cancel pressed, do nothing
	});
}

/**
 * Manage all files
 */
function manageFiles() {
	var files = generateFileList();
	// generate HTML list of files
	var html = document.createElement("span");
	var list = document.createElement("ul");
	for (var i in files) {
		var item = document.createElement("li");
		item.innerHTML = i.substring(27); // get the file name (starts on character 27)
		item.className = "fileObject"; // for styling
		item.onclick = function() { // on click add class to show it's selected
			$("ul > li.fileObject").removeClass("selected");
			$(this).addClass("selected");
		};
		list.appendChild(item);
	}
	html.appendChild(list);
	html.appendChild(document.createElement("br")); // add line break
	var deleteButton = document.createElement("button");
	deleteButton.className = "red";
	deleteButton.innerHTML = "Delete";
	deleteButton.onclick = function() {
		dialog("YN", "Delete File", "Are you sure you would like to delete the selected file?", function(response) {
			if (response === "yes") {
				var el = $("ul > li.selected")[0];
				el.setAttribute("delete","yes"); // mark the current selection for deletion
				$(el).hide(); // hide it
			}
		});
	};
	html.appendChild(deleteButton);
	
	dialog("OKC", "Manage Files", html, function(response, root) {
		if (response === "OK") {
			$("ul > li[delete]").each(function(inx, el) {
				var fileName = el.innerHTML;
				storageDelete(getFileKey(fileName));
				if (fileName === currentFile.fileName) { // deleted the currently opened file
					clear(); // clear current file
				}
			});
		} else { // cancel
			$("ul > li[delete]").each(function(inx, el) {
				el.removeAttribute("delete"); // clear deletion mark
			});
		}
	});
}

/**
 * Delete the current file
 */
function deleteFile() {
	dialog("YN", "Delete File", "Are you sure you would like to delete the file?", function(response) {
		if (response === "yes") { // yes
			if (global.hasBeenSaved) {
				storageDelete(getFileKey());
			}
			clear();
			dialog("OK", "", "File Deleted");
		}
	});
}

/**
 * Import file as text
 */
function importFile() {
	// check if needs to be saved
	checkSave(function() {
		var html = "Text here: <br /><textarea id='file'></textarea>";
		dialog("OKC", "Import", html, function(response, root) {
			if (response === "OK") {
				var text = $(root).find("textarea#file").val();
				text = text.replace(/\n/g,''); //remove line breaks
				try {
					JSON.parse(text); // see if text is parseable
				} catch (e) {
					dialog("OK", "", "Invalid text.");
					return; // don't continue, invalid text
				}
				clear();
				currentFile = JSON.parse(text);
				setUpFile();
			}
		});
	});
}


/**
 * Share the file as text
 */
function share() {
	var text = JSON.stringify(currentFile); // text is JSON stringified version of current file
	var div = document.createElement("div");
		div.className = "code"; // appropriate styling
		div.innerHTML = text; // fill with text
	var html = "Text to share: " + div.outerHTML; 
	dialog("OK", "Share", html);
}

/**
 * Internal function that actually clears the files
 */
function clear() {
	clearAllPlayers();
	currentFile = new File();
	$(".title").html(null); // clear title
	$("section#resultsSummary > div").html(null); // clear results
	if (visible("section#resultsSummary")) { // hide results
		getButton("Results Summary").click(); 
	}
	$("section#scale > div").html(null); // clear scale
	$("section#notes > div").html(null); // clear notes
	global.hasBeenSaved = false;
}
/**
 * Internal function that clears all players
 */
function clearAllPlayers() {
	var players = length(currentFile.players);
	for (var i = 0; i < players; i++) { // remove players 1 by 1
		removePlayer();
	}
}

/**
 * Internal function that actually saves the file
 */
function saveFile() {
	global.hasBeenSaved = true;
	backupFile = duplicate(currentFile); // copy to backup for later comparison
	var key = getFileKey();
	storageSet(key, JSON.stringify(currentFile));
}

/**
 * Internal function that deals with renaming the current file
 */
function rename() {
	var name = $(".title").html();
	currentFile.name = name; // edited text of file <div> is set as title
	
	if ($(".title").height() > 144) { // shrink text if it has a long title
		$(".title").css("font-size","32px");
	} else if ($(".title").height() < 72){
		$(".title").css("font-size","48px");
	}
}

/**
 * Checks to see if current file should be saved
 * @param {function} callback if ready to proceed
 */
function checkSave(callback) {
	if (editsMade()) { // hasn't been saved
		dialog("YNC", "", "Would you like to save the current file?", function(response) {
			if (response === "yes") { // yes
				if (global.hasBeenSaved) {
					save();
				} else {
					saveAs();
				}
				callback();
			} else if (response === "no") { // no
				callback();
			} else { }// cancel, do nothing
		});
	} else {
		callback();
	}
}

/**
 * Generates list of files in storage
 * @returns {Object} list of files
 */
function generateFileList() {
	var keys = Object.keys(getStorageArea());
	var files = {};
	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		if (key.match("Conflict Forecasting File: ")) { // proper label format
			files[key] = localStorage[key];
		} 
	}
	return files;
}

/**
 * A file object
 * @returns {File} the file object
 */
function File() {
	this.name = "";
	this.fileName = "";
	this.players = {}; // {"id": player}
	this.shockSalience = -1; // don't shock salience
	this.forceLength = -1; // don't force length;
	this.scale = {};
	this.notes = "";
	this.defaultResult = -1;
	this.creator = window.license.name;
}

/**
 * Checks if edits have been made to the current file
 * @returns {Boolean} true if edits have been made
 */
function editsMade() {
	return JSON.stringify(backupFile) !== JSON.stringify(currentFile);
}
/**
 * Get the file storage key
 * @param {name} name optional name of file
 * @returns {String} the key
 */
function getFileKey(name) {
	var name = name || currentFile.fileName;
	return "Conflict Forecasting File: " + name;
}

/**
 * Retrieve data from storage
 * @param {type} key the storage key
 * @returns {unresolved} the data
 */
function storageGet(key) {
	return localStorage[key];
}
/**
 * Send data to storage
 * @param {type} key the storage key
 * @param {type} data the data to store
 */
function storageSet(key, data) {
	localStorage[key] = data;
}
/**
 * Delete storage item
 * @param {type} key the storage key
 */
function storageDelete(key) {
	localStorage.removeItem(key);
}

/**
 * Gets all data in storage
 */
function getStorageArea() {
	return localStorage;
}
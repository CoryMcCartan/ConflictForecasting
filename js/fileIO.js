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
		generateFileList(function(files) {
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
					var key = getFileKey(name);
					storageGet(key, function(data) {
						currentFile = JSON.parse(data[key]);
						setUpFile();
					}); // retrieve file and parse it into an object.
				}
			});
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
	generateFileList(function(files) {
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
		div.innerText = text; // fill with text
	var html = "Text to share: " + div.outerHTML; 
	dialog("OK", "Share", html);
}

/**
 * Internal function that actually clears the files
 * @param {boolean} keepFile don't delete current file, only clear UI
 */
function clear(keepFile) {
	if (keepFile === undefined) keepFile = false;
	clearAllPlayers(keepFile);
	if (!keepFile) {
		currentFile = new File();
		global.hasBeenSaved = false;
		$("select#scenarioSelect").html(null);
		$("div#description").html(null);
		if (visible("section#resultsSummary")) { // hide results
			getButton("Results Summary").click(); 
		}
		if (visible("section#roundByRound")) { // hide results
			getButton("Round-by-Round Data").click(); 
		}
		if (visible("section#forecastGraph")) { // hide results
			getButton("Forecast Graph").click(); 
		}
	}
	$(".title").html(null); // clear title
	$("section#resultsSummary > div").html(null); // clear results
	$("section#cost-benefit > div").html(null); // clear results
	$("section#roundByRound > div").html(null); // clear results
	$("section#forecastGraph > div").html(null); // clear results
	$("section#scale > div").html(null); // clear scale
	$("section#notes > div").html(null); // clear notes
}
/**
 * Internal function that clears all players
 */
function clearAllPlayers() {
	var players = length(currentFile.f.players);
	for (var i = 0; i < players; i++) { // remove players 1 by 1
		removePlayer();
	}
}

/**
 * Create a new game scenario
 */
function newScenario() {
	var html = "<input type='text' id='name' placeholder='Name' /><br /><textarea type='text' id='description' placeholder='Description'></textarea>";
	dialog("OKC", "New Scenario", html, function(response, root) {
		if (response === "OK") {
			var name = root.querySelector("input#name").value; // get name
			if (name === "") return; // needs a name
			var description = root.querySelector("textarea").value.replace(/\n/g,"<br />"); // get description and format as HTML
			
			currentFile.addScenario(name, description);
			var newOption = document.createElement("option");
			newOption.innerHTML = name;
			newOption.selected = true;
			$("select#scenarioSelect").append(newOption);
			
			currentFile.f = scenario; // set active scenario
			currentFile.scenarioName = name;
			
			changeScenario();
		} else { } // cancel
	});
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
 * @param {function} callback with list of files as object
 */
function generateFileList(callback) {
	getStorageArea(function(all) {
		var keys = Object.keys(all);
		var files = [];
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (key.match("Conflict Forecasting File: ")) { // proper label format
				files.push(key);
			} 
		}
		storageGet(files, callback);
	});
}

/**
 * A file object
 * @returns {File} the file object
 */
function File() {
	this.name = "";
	this.fileName = "";
	this.scenarios = {"Main": new Scenario()};
	this.f = this.scenarios["Main"];
	this.scenarioName = "Main";
	this.scale = {};
	this.creator = window.license.name;
	
	this.addScenario = function(name, description) {
		this.scenarios[name] = duplicate(this.f); // duplicate the current scenario under a new name
		this.scenarios[name].description = description;
	};
}
/**
 * A possible game scenario
 * @returns {Scenario} the scenario object
 */
function Scenario() {
	this.description = "";
	this.players = {}; // {"id": player}
	this.shockSalience = -1; // don't shock salience
	this.forceLength = -1; // don't force length;
	this.notes = "";
	this.defaultResult = -1;
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
 * @param {string} key the storage key
 * @param {function} callback
 */
function storageGet(key, callback) {
	chrome.storage.local.get(key, callback);
}
/**
 * Send data to storage
 * @param {type} key the storage key
 * @param {type} data the data to store
 */
function storageSet(key, data) {
	var pair = {};
	pair[key] = data;
	
	chrome.storage.local.set(pair, function() {
		console.log("SET " + key + ", VALUE: " + data);
		console.log( (chrome.runtime.lastError || {message: ""}).message ) ;
	});
}
/**
 * Delete storage item
 * @param {type} key the storage key
 */
function storageDelete(key) {
	chrome.storage.local.remove(key, function() {
		console.log( (chrome.runtime.lastError || {message: ""}).message );
	});
}

/**
 * Gets all data in storage
 * @param {function} callback
 */
function getStorageArea(callback) {
	storageGet(null, callback);
}
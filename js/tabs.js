/** CODE FOR TABBED USER INTERFACE  */

function templateSetup() {
	/**
	 * Prototype template object for a tab
	 */
	var tabPrototype = Object.create(HTMLElement.prototype, {
	  createdCallback: {
		value: function() {
		  var template = document.querySelector('#tabtemplate'); // get template
		  this.createShadowRoot().appendChild(template.content.cloneNode(true)); // fill custom element with template content

		  var tab = this.$S("#title"); // select tab label
		  tab.innerHTML = this.title; // give it the label specified in the title attribute
		  tab.style.left = 24 + (parseInt(this.getAttribute("tab-index")) - 1) * 132 + "px"; // calculate horizontal position
		  tab.onclick = function() {
			  $("control-tab").each(function() {
				  $(this.$S("#title")).removeClass("target"); // style normally
				  $(this.$S(".content")).hide(); // hide tab content
			  });
			  $(this).addClass("target"); // select tab
			  $(this).parent().children(".content").show(); // show tab content
		  };

		}
	  }
	});
	document.register('control-tab', {prototype: tabPrototype});
	document.register('tab-group', {prototype: Object.create(HTMLDivElement.prototype)});


	/**
	 * Prototype template object for tab button
	 */
	var buttonPrototype = Object.create(HTMLElement.prototype, {
		createdCallback: {
			value: function() {
				var template = document.querySelector('#buttontemplate'); // get template
				this.createShadowRoot().appendChild(template.content.cloneNode(true)); // fill custom element with template content

				var name = this.innerHTML; // name/label of button
				this.$S(".icon").innerHTML = name[0].toUpperCase(); // generate icon -- uppercase first letter of command
				var colors = getColors(this.getAttribute("color")); // get colors for icon
				this.$S(".icon").style.backgroundColor = colors.backgroundColor;
				this.$S(".icon").style.color = colors.textColor;
				this.$S(".label").innerHTML = name; // create label
			}
		}
	});
	/**
	 * Prototype template object for tab button that toggles
	 */
	var buttonTogglePrototype = Object.create(HTMLElement.prototype, {
		createdCallback: {
			value: function() {
				var template = document.querySelector('#buttontemplate'); // get template
				this.createShadowRoot().appendChild(template.content.cloneNode(true)); // fill custom element with template content

				var name = this.innerHTML; // name/label of button
				$(this.$S(".button")).addClass("togglebutton"); // keep default button styling;
				$(this.$S(".button")).removeClass("button"); // prevent animations on hover and click;
				this.$S(".icon").innerHTML = name[0].toUpperCase(); // generate icon -- uppercase first letter of command
				var colors = getColors(this.getAttribute("color")); // get colors for icon
				this.$S(".icon").style.backgroundColor = colors.backgroundColor;
				this.$S(".icon").style.color = "black";
				this.$S(".label").innerHTML = name; // create label
				if(this.getAttribute("on") === "true") { // user has specified button should be on
					this.turnOn();
				} else { // should be off
					this.turnOff();
				}

				$(this).click(function() {
					if (this.on === true) { // turn off
						this.turnOff();
					} else { // turn on
						this.turnOn();
					}
				});
			}
		},
		turnOn: {
			value: function() {
				this.on = true;
				$(this.$S(".icon")).removeClass("off");
				this.$S(".label").style.color = "black";
			}
		},
		turnOff: {
			value: function() {
				this.on = false;
				$(this.$S(".icon")).addClass("off");
				this.$S(".label").style.color = "#727272";
			}
		}
	});
	document.register('tab-button', {prototype: buttonPrototype});
	document.register('toggle-button', {prototype: buttonTogglePrototype});
	document.register('button-spacer', {prototype: Object.create(HTMLDivElement.prototype)});
}


/**
 * Set FG and BG colors given the color attribute on each button
 * @param {type} color the color attribute on the button
 * @returns {object} an object with the colors -- backgroundColor and textColor keys
 */
function getColors(color) { // based on color name in tag, chooses rgb values for text and background color
	var bg;
	var txt;
	switch (color) {
		case "red":
			bg = "#e00";
			txt = "#eee";
			break;
		case "orange":
			bg =  "#fb0";
			txt = "#444";
			break;
		case "yellow":
			bg =  "#ee0";
			txt = "#444";
			break;
		case "green":
			bg =  "#1e1";
			txt = "#eee";
			break;
		case "blue":
			bg =  "#47f";
			txt = "#eee";
			break;
		case "purple":
			bg =  "#b0e";
			txt = "#eee";
			break;
		case "grey":
			bg =  "#444";
			txt = "#eee";
			break;
		default:
			bg =  "#eee";
			txt = "#444";
			break;
	}
	
	return {backgroundColor: bg, textColor: txt};
}

/**
 * jQuery-style selector on an element's shadow DOM
 * @param {type} selector the selector
 * @returns {HTMLElement} the (first) object that matches
 */
HTMLElement.prototype.$S = function(selector) { // jQuery-style select on shadow DOM
	return this.webkitShadowRoot.querySelector(selector);
};
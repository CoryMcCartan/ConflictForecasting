document.onreadystatechange = function () { 
	if (document.readyState === "complete") { 
		document.querySelector(".close").onclick = function() {
			chrome.app.window.current().close();
		};
	}
};  
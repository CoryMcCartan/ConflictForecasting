chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('index.html', {
		'width': 1024,
		'height': 720,
		'minWidth': 1024,
		'minHeight': 720,
		'frame': 'none'
	});
});
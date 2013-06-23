/* globals chrome */
chrome.app.runtime.onLaunched.addListener(function (arg) {
	'use strict';
	chrome.app.window.create('main.html',{
		bounds: { 
			width:1024, 
			height:600
		}, 
		type:"shell"
	});
});

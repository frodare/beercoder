/* global requirejs, console */
(function () {
	'use strict';
	requirejs.config({
		//By default load any module IDs from js/lib
		baseUrl: '/lib',
		//except, if the module ID starts with "app",
		//load it from the js/app directory. paths
		//config is relative to the baseUrl, and
		//never includes a ".js" extension since
		//the paths config could be for a directory.
		paths: {
			jquery: '/lib/jquery/jquery-2.0.0',
			jqueryui: "jqueryui/jquery-ui"
		},
		shim: {
			jqueryui: {
				exports: "$",
				deps: ['jquery']
			}
		},
		callback: function () {
			console.log('loaded requirejs config');
		}
	});
}());
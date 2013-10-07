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
			jquery: 'jquery/jquery-2.0.0',
			jqueryui: "jqueryui/jquery-ui",
			doTCompiler:  'doT',
			text: 'text',
			doT: 'requirejs-doT'
		},
		shim: {
			jqueryui: {
				exports: "$",
				deps: ['jquery']
			}
		},
		callback: function () {
			//console.log('loaded requirejs config');
		},
		doT: {
			ext: '.dot.html', // extension of the templates, defaults to .dot
			templateSettings: {
				evaluate: /\{\{([\s\S]+?)\}\}/g,
				interpolate: /\{\{=([\s\S]+?)\}\}/g,
				encode: /\{\{!([\s\S]+?)\}\}/g,
				use: /\{\{#([\s\S]+?)\}\}/g,
				define: /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
				conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
				iterate: /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
				varname: 'data',
				strip: true,
				append: true,
				selfcontained: false
			}
		}
	});
}());
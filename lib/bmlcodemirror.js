/*globals define*/
define(["jquery", "brewtables", "codemirror/lib/codemirror", "codemirror/lib/util/simple-hint"], function ($, brewtables, codemirror, simpleHint) {
	'use strict';

	var grainTable = brewtables.grains,
		hopTable = brewtables.hops,
		styleTable = brewtables.styles;

	codemirror.defineMode("bml", function(cmCfg, modeCfg) {
		var process = {
			info: function(stream, state) {
				if (stream.eatWhile(/[^:]/)) {
					if (stream.eol()) {
						return 'error';
					}
					return 'tag';
				} else {
					stream.skipToEnd();
					return '';
				}
			},
			grain: function(stream, state) {
				stream.skipToEnd();
				var match = stream.string.match(/^\s*([0-9\/.]+)\s*(lbs|lb|oz)\s+(.*) \[(?:\s*([0-9.]+)([a-z]+)\s*)+\]$/i);
				if (match === null) {
					return 'error';
				}
				return 'grain';
			},
			hops: function (stream, state) {
				
				if(state.inHop){
					stream.skipToEnd();
					state.inHop = false;
					return 'attribute';
				}
				
				var match = stream.string.match(/^\s*([0-9]+)\s*(min)?\s*([0-9\/.]+)\s*(lbs|lb|oz)\s*(.*) \[(?:\s*([0-9.]+)([a-z%]+)\s*)+\]$/i);
				
				if (match === null) {
					stream.skipToEnd();
					return 'error';
				}

				state.inHop = true;
				stream.eatWhile(/[^\[]/);
				return 'hops';
			}/*,
			yeast: function (data, line) {
				var match = line.match(/^\s*([0-9]+)\s*(?:pkg)?\s*(.*?)\s*([0-9.]+)%/i);
				if (!match) {
					return;
				}
				data.yeast.push({
					amount: match[1],
					name: match[2],
					att: match[3]
				});
			},
			notes: function (data, line) {
				if(!data.notes){
					data.notes = line;
				}else{
					data.notes += '\n' + line;
				}
			}*/
		};

		return {
			token: function(stream, state) {
				/*
				 * read section
				 */
				var match = stream.string.match(/^\s*-{2,}([^\-]{2,})-*/);
				if (match) {

					state.section = match[1].toLowerCase();
					state.recipe[state.section] = {};
					stream.skipToEnd();
					return 'header';
				}

				/*
				 *
				 */
				if (process[state.section]) {
					return process[state.section](stream, state);
				}

				stream.skipToEnd();
				return '';

			},
			startState: function() {
				return {
					recipe: {},
					section: ''
				};
			}
		};
	});

	codemirror.defineMIME("text/x-bml", "bml");

	function suggestGrain(pre, s) {
		var i, l = grainTable.length,
			a = [],
			name;

		if(!pre){
			pre = '1 lb ';
		}


		for (i = 0; i < l; i++) {
			var re = new RegExp(s, "i");
			name = grainTable[i].name;
			if (name.match(re) !== null) {
				a.push(pre + name + ' [' + grainTable[i].color + 'L ' + grainTable[i].ppg + 'PPG]');
			}
		}
		return a;
	}

	function suggestHop(pre, s) {
		var i, l = hopTable.length,
			a = [],
			name;

		if(!pre){
			pre = '60 min 1 oz ';
		}

		for (i = 0; i < l; i++) {
			var re = new RegExp(s, "i");
			name = hopTable[i].name;
			if (name.match(re) !== null) {
				a.push(pre + name + ' [' + hopTable[i].aa + '%]');
			}
		}

		return a;
	}

	function suggestStyle(s) {
		var i, l = styleTable.length,
			a = [],
			name, cat;

		for (i = 0; i < l; i++) {

			var re = new RegExp(s, "i");
			name = styleTable[i].style;
			cat = styleTable[i].category;

			if (name.match(re) !== null || cat.match(re) !== null) {
				a.push('style: ' + cat + ' 2008 ' + name);
			}
		}

		return a;
	}

	var autoPatterns = {
		'grain': /^[^\[]+$/,
		'hops': /^[^\[]+$/,
		'info': /./
	};

	simpleHint(codemirror);

	codemirror.bmlHint = function(cm) {
		var i, cursor = cm.getCursor();

		var text = cm.getRange({
			line: cursor.line,
			ch: 0
		}, cursor);


		var eol = cm.getLine(cursor.line).length;

		var symbol = '';

		var section = cm.getStateAfter(cursor.line).section;
		//console.log(state.section);
		/*
			for (i = text.length - 1; i >= 0; i--) {
				if (text[i] === ' ') {
					break;
				} else {
					typed = text[i] + typed;
				}
			}
		 */

		var hints, m;
		if (section === 'grain') {
			/*
			 * remove the weight
			 */
			

			m = text.match(/^\s*([0-9\/.]+\s*(?:lbs|lb|oz)\s+)([^\[]*)/);


			if(m !== null){
				hints = suggestGrain(m[1], m[2]);
			}else{
				hints = suggestGrain('', text);
			}
		} else if (section === 'hops') {
			/*
			 * remove the weight
			 */
			
			m = text.match(/^\s*([0-9]+\s*(?:min)?\s*[0-9\/.]+\s*(?:lbs|lb|oz)\s*)([^\[]*)/i);


			if(m !== null){
				hints = suggestHop(m[1], m[2]);
			}else{
				hints = suggestHop('', text);
			}
		} else if (section === 'info') {
			m = text.match(/^\s*style\s*:\s*(.*)/);

			if(m !== null){

				hints = suggestStyle(m[1]);
			}else{
				return;
			}
		} else {
			return;
		}

		return {
			list: hints,
			from: {
				line: cursor.line,
				ch: cursor.ch - text.length
			},
			to: {
				line: cursor.line,
				ch: eol
			}
		};
	};

	return function (element, options) {
		var defaultOptions = {
				mode: 'bml',
				lineNumbers: false,
				matchBrackets: true,
				theme: "default",
				extraKeys: {
					"Ctrl-Space": "autocomplete"
				}
			},
			o = options || {};

		if(options){
			o = $.extend(defaultOptions, options);
		}

		var cm;

		var oldOnChange = o.onChange;

		o.onChange = function() {

			var cursor = cm.getCursor(),
				section = cm.getStateAfter(cursor.line).section,
				line = cm.getLine(cursor.line);

			/*
			 * determine wether to auto fire or not
			 */

			if(autoPatterns[section]) {
				if(line && line.match(autoPatterns[section])) {
					codemirror.simpleHint(cm, codemirror.bmlHint);
				}
			}

			if($.isFunction(oldOnChange)){
				oldOnChange.apply(this, arguments);
			}

		};

		cm = codemirror.fromTextArea(element, o);

		return cm;
	};
});

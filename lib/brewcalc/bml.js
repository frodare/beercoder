/*globals define*/
define(["jquery", "CodeMirror"], function () {



	/*global CodeMirror:true grainTable:true hopTable:true styleTable:true */
	CodeMirror.defineMode("bml", function(cmCfg, modeCfg) {
		'use strict';

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
					//console.log('seciton: [' + state.section + ']');
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

	CodeMirror.defineMIME("text/x-bml", "bml");


	function suggestGrain(pre, s) {
		'use strict';
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
		'use strict';
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
		'use strict';
		var i, l = styleTable.length,
			a = [],
			name, cat;

		for (i = 0; i < l; i++) {

			var re = new RegExp(s, "i");
			name = styleTable[i].style;
			cat = styleTable[i].category;

			if (name.match(re) !== null || cat.match(re) !== null) {
				//console.log('match!');
				a.push('style: ' + cat + ' 2008 ' + name);
			}
		}

		return a;
	}


	CodeMirror.bmlHint = function(cm) {
		'use strict';
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



	return (function($) {
		'use strict';

		function parseParams(s) {
			var a = s.split(/\s+/);
			var params = {};
			$.each(a, function (i, param) {
				var m = param.match(/^([0-9.\/]*)([^0-9]+)$/i);
				if(m !== null){
					params[m[2].toLowerCase()] = m[1];
				}
			});
			return params;
		}


		var processInfo = {
			style: function (data) {
				var match = data.match(/^\s*([0-9]{1,2}[a-z]).*?/i);
				if(match === null){
					return data;
				}
				var cat = match[1].toUpperCase();
				var guideline;
				$.each(styleTable, function (i, g) {
					if (g.category === cat) {
						guideline = g;
						return false;
					}
				});
				return guideline;
			}
		};



		var process = {
			info: function(data, line) {
				var match = line.match(/^\s*([a-z]+)\s*:\s*(.*)\s*/i);
				if (!match) {
					return;
				}
				var key = match[1].toLowerCase();

				if(processInfo[key]){
					data.info[key] = processInfo[key](match[2]);
				}else{
					data.info[key] = match[2];
				}


				
				
			},
			grain: function (data, line) {
				var match = line.match(/^\s*([0-9\/.]+)\s*(lbs|lb|oz)\s*([^\[]+)\s*\[([^\[]+)\]/i);
				if (!match) {
					return;
				}

				var params = parseParams(match[4]);
				
				data.grain.push({
					amount: match[1].toLowerCase(),
					unit: match[2].toLowerCase(),
					name: match[3],
					color: params.l,
					ppg: params.ppg
				});
			},
			hops: function (data, line) {
				var match = line.match(/^\s*([0-9]+)\s*(?:min)?\s*([0-9\/.]+)\s*(lbs|lb|oz)\s*([^\[]+)\s*\[([^\[]+)\]/i);
				if (!match) {
					return;
				}

				var params = parseParams(match[5]);

				data.hops.push({
					min: match[1].toLowerCase(),
					amount: match[2].toLowerCase(),
					unit: match[3].toLowerCase(),
					name: match[4],
					aa: params['%']/100
				});
			},
			yeast: function (data, line) {
				var match = line.match(/^\s*([0-9]+)\s*(?:pkg)?\s*([^\[]+)\s*\[([^\[]+)\]/i);
				if (!match) {
					return;
				}

				var params = parseParams(match[3]);

				data.yeast.push({
					amount: match[1],
					name: match[2],
					att: params['%']/100
				});
			},
			notes: function (data, line) {
				if(!data.notes){
					data.notes = line;
				}else{
					data.notes += '\n' + line;
				}
			}
		};


		return function(bml) {
			var section;

			var data = {
				grain: [],
				hops: [],
				yeast: [],
				info: {}
			};

			$.each(bml.split('\n'), function(i, line) {
				
				/*
				 * detect new section
				 */
				var sectionMatch = line.match(/^-{2,}([^\-]+)/);
				if (sectionMatch !== null) {
					section = sectionMatch[1].toLowerCase();
					return;
				}

				if (!section) {
					return;
				}

				if (process[section]) {
					process[section](data, line);
				}

				
			});
			return data;
		};

	});

});
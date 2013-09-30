/*globals define*/
define(["jquery", "brewtables"], function ($, brewtables) {
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
			$.each(brewtables.styles, function (i, g) {
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

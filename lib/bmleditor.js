/*globals define*/
define(["jquery", "bmlparser", "bmlcodemirror", "brewcalc", "jqueryui"], function ($, bmlparser, cm, brewcalc) {
	'use strict';

	var blankStats = {
		abv: 0,
		abw: 0,
		bugu: 0,
		buog: 0,
		cal12oz: 0,
		fg: '1.000',
		og: '1.000',
		hoz: 0,
		ibu: 0,
		srm: 0,
		glbs:0
	};

	$.widget("beercoder.bmleditor", {

		_create: function(){
			var self = this,
				e = self.element,
				o = self.options;

			self._buildEditor();

			self.set(o.bml);
		},

		_buildEditor: function () {
			var self = this,
				e = self.element,
				editorContainer = $('<textarea/>');

			editorContainer.appendTo(e);

			self.editor = cm(editorContainer[0], {
				onChange: function () {
					self.update();
				}
			});

			e.on('bmleditorchange', null, function () {
				var recipe = self.recipe,
					stats = self.stats,
					style = recipe.info.style;

				/*
				 * update editor gutter values
				 */
				e.find('.gutter-info').remove();

				setTimeout(function() {

					e.find('pre .cm-grain:nth-child(1)').each(function(i, e) {
						var grainLine = $(e);
						var offset = grainLine.position();
						//hack, fixme
						if(offset.top < 10) {
							return;
						}

						var info = $('<div class="gutter-info"></div>');

						var amount = brewcalc.toDecimal(grainLine.text().replace(/^\s*([0-9.\/]+)/, '$1'));

						var percent = (stats && (100 * amount / stats.glbs).toFixed(1)) || 0;

						info.html(percent + '%');

						info.css({
							top: offset.top
						});

						grainLine.parents('div').first().after(info);

					});


					e.find('pre .cm-hops:nth-child(1)').each(function(i, e) {
						var line = $(e);
						var offset = line.position();
						//hack, fixme
						if(offset.top < 10) {
							return;
						}

						var info = $('<div class="gutter-info"></div>');

						var amount = brewcalc.toDecimal(line.text().match(/\s*([0-9.\/]+)\s*oz/)[1]);


						var percent = (stats && (100 * amount / stats.hoz).toFixed(1)) || 0;

						info.html(percent + '%');

						info.css({
							top: offset.top
						});

						line.parents('div').first().after(info);

					});


				}, 0);
			});
		},

		update: function () {
			var self = this,
				cm = self.editor,
				cursor = cm.getCursor(),
				section = cm.getStateAfter(cursor.line).section,
				line = cm.getLine(cursor.line);

			var autoPatterns = {
				'grain': /^[^\[]+$/,
				'hops': /^[^\[]+$/,
				'info': /./
			};

			/*
			 * determine wether to auto fire or not
			 *
			if(autoPatterns[section]) {
				if(line && line.match(autoPatterns[section])) {
					CodeMirror.simpleHint(cm, CodeMirror.bmlHint);
				}
			}
			*/
			self._parse(cm.getValue());

			//delay/debounce
			//localStorage.bml = cm.getValue();
		},

		_parse: function (bml) {
			var self = this,
				stats, recipe;

			self.bml = bml;
			self.stats = {};
			self.recipe = {};

			//console.log('BML', bml);

			if(!bml){
				return;
			}

			recipe = bmlparser(bml);

			//console.log('Recipe', recipe);

			try{
				stats = brewcalc.compute(recipe);
			}catch(err){
				stats = blankStats;
				console.log('compute error: ', err);
			}


			self.stats = stats;
			self.recipe = recipe;

			//console.log('Stats', stats);

			self._trigger('change', null, {
				bml: bml,
				recipe: recipe,
				stats: stats
			});
		},

		clear: function () {
			this.set();
		},

		set: function (bml) {
			var self = this;
			self.editor.setValue(bml || '');
		},

		get: function () {
			var self = this,
				cm = self.editor;
			return cm.getValue();
		},

		getData: function () {
			var self = this,
				cm = self.editor;
			return {
				bml: cm.getValue(),
				stats: self.stats,
				recipe: self.recipe
			};
		}
	});
});

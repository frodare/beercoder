/* globals BREWCALC, CodeMirror, BML, chrome */

var BEERCODER = {};

(function() {
	'use strict';

	BEERCODER.tmpl = function (id) {
		return $('#' + id).clone().removeAttr('id');
	};

	BEERCODER.storage = {};
	if(window.chrome && window.chrome.storage && window.chrome.storage.local){
		BEERCODER.storage = window.chrome.storage.local;
	}else if(window.localStorage){
		BEERCODER.storage = window.localStorage;
	}

	$.widget("beerCoder.recipeParameter", {
		
		_create: function(){
			var self = this,
				e = self.element,
				o = self.options;

			BEERCODER.tmpl('tmplRecipeParameter').appendTo(e);
			self.label = e.find('.label');
			self.estimateDisp = e.find('.est');
			self.minDisp = e.find('.guide-min');
			self.maxDisp = e.find('.guide-max');
			self.avgDisp = e.find('.guide-avg');
		},

		clear: function () {
			this.set();
		},

		set: function (paramVal) {
			var self = this;
			
			self.estimate = paramVal.est;
			self.min = paramVal.min;
			self.max = paramVal.max;

			self.minDisp.hide();
			self.maxDisp.hide();
			self.avgDisp.hide();

			if(paramVal.min && paramVal.max){
				self.minDisp.show().text(paramVal.min);
				self.maxDisp.show().text(paramVal.max);
			}else if(paramVal.avg){
				self.avgDisp.show().text(paramVal.avg);
			}

			self.estimateDisp.text(paramVal.est || '');
			self.label.text(paramVal.label);

			self.update();
		},

		update: function () {
			var self = this,
				e = self.element;

			if(!self.estimate && self.estimate !== 0){
				e.removeClass('warning').removeClass('over').removeClass('under');
				return;
			}

			if(self.estimate < self.min){
				e.addClass('warning').addClass('under');
			}else if(self.estimate > self.max){
				e.addClass('warning').addClass('over');
			}else{
				e.removeClass('warning').removeClass('over').removeClass('under');
			}
		},

		setBounds: function(min, max) {
			var self = this;

			
		}
	});

	$.widget("beerCoder.recipeCard", {

		_create: function(){
			var self = this,
				e = self.element,
				o = self.options;

			BEERCODER.tmpl('tmplRecipeCard').appendTo(e);
			self._buildEditor();
			self._buildParameters();
			if(o.bml){
				self.set(o.bml);
			}
			
		},

		_buildEditor: function () {
			var self = this,
				e = self.element,
				editorContainer = self.element.find('textarea');

			self.editor = CodeMirror.fromTextArea(editorContainer[0], {
				mode: 'bml',
				lineNumbers: false,
				matchBrackets: true,
				theme: "default",
				onChange: function() {
					self.update();
				},
				extraKeys: {
					"Ctrl-Space": "autocomplete"
				}
			});

			e.on('recipecardchange', null, function () {
				var recipe = self.recipe,
					stats = self.stats,
					style = recipe.info.style;

				/*
				 * update editor gutter values
				 */
				e.find('.gutter-info').remove();

				setTimeout(function() {

					console.log('updating gutter values');

					//console.log($('.cm-grain:visible'));
					e.find('pre .cm-grain:nth-child(1)').each(function(i, e) {
						var grainLine = $(e);
						var offset = grainLine.position();
						//hack, fixme
						if(offset.top < 10) {
							return;
						}

						var info = $('<div class="gutter-info"></div>');

						var amount = BREWCALC.toDecimal(grainLine.text().replace(/^\s*([0-9.\/]+)/, '$1'));

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

						var amount = BREWCALC.toDecimal(line.text().match(/\s*([0-9.\/]+)\s*oz/)[1]);


						var percent = (stats && (100 * amount / stats.hoz).toFixed(1)) || 0;

						console.log(amount);

						info.html(percent + '%');

						info.css({
							top: offset.top
						});

						line.parents('div').first().after(info);

					});


				}, 0);
			});
		},

		_buildParameters: function () {
			var self = this,
				e = self.element,
				specs = e.find('.primaryBeerSpecs'),
				paramVals = {
					og: e.find('.spec-og').recipeParameter(),
					fg: e.find('.spec-fg').recipeParameter(),
					ibu: e.find('.spec-ibu').recipeParameter(),
					srm: e.find('.spec-srm').recipeParameter(),
					bugu: e.find('.spec-bugu').recipeParameter(),
					abv: e.find('.spec-abv'),
					abw: e.find('.spec-abw'),
					cal12oz: e.find('.spec-cal12oz'),
					glbs: e.find('.spec-glbs'),
					hoz: e.find('.spec-hoz'),
					glass: e.find('.glass')
				};


			e.on('recipecardchange', null, function () {
				var recipe = self.recipe,
					stats = self.stats,
					style = recipe.info.style;

				console.log('recipe', recipe, 'stats', stats);


				var codes = ['og', 'fg', 'ibu', 'srm'];

				$.each(codes, function (i, paramCode) {
					var paramVal = {};
					if($.isPlainObject(style)){
						paramVal.min = style[paramCode].min;
						paramVal.max = style[paramCode].max;
					}
					paramVal.est = (stats && stats[paramCode] || '--');
					paramVal.label = paramCode;
					paramVals[paramCode].recipeParameter('set', paramVal);
				});

				/*
				 * set the bugu, it has no min and max, just avg so it has to be treate differently
				 */
				var paramVal = {},
					paramCode = 'bugu';

				if($.isPlainObject(style)){
					paramVal.avg = style[paramCode];
				}
				paramVal.est = (stats && stats[paramCode] || '--');
				paramVal.label = paramCode;
				paramVals[paramCode].recipeParameter('set', paramVal);

				codes = ['abv', 'abw', 'cal12oz', 'glbs', 'hoz'];

				$.each(codes, function (i, code) {
					paramVals[code].html((stats && stats[code] || '--'));
				});

				//paramVals.glass.css('backgroundColor', BREWCALC.units.convert('SRM', 'HTML_RGB', (stats && stats.srm || 0)));

				var color = BREWCALC.units.convert('SRM', 'RGB', (stats && stats.srm || 0));

				//console.log('color', color);

				paramVals.glass.css({
					'backgroundColor': BREWCALC.units.convert('SRM', 'HTML_RGB', (stats && stats.srm || 0)),
					'boxShadow': '0 0 20px rgba(' + color.r + ', ' + color.g + ', ' + color.b + ',1)'
				});
				//box-shadow: 0 0 12px rgba(255,255,255,0.2);

				//paramVals.glass.css('background', '-webkit-radial-gradient(45px 45px, cover, rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', 1) 0%, rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', 0) 100%)');
				//background: -webkit-radial-gradient(45px 45px, cover, rgb(255, 0, 0) 0%, rgb(0, 0, 255) 100%);
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
			 */
			if(autoPatterns[section]) {
				if(line && line.match(autoPatterns[section])) {
					CodeMirror.simpleHint(cm, CodeMirror.bmlHint);
				}
			}

			self._parse(cm.getValue());

			//delay/debounce
			//localStorage.bml = cm.getValue();
		},

		_parse: function (bml) {
			var self = this,
				stats, recipe;

			if(!bml){
				return;
			}

			//console.log('BML', bml);

			recipe = BML.parse(bml);
			//console.log('Recipe', recipe);

			try{
				stats = BREWCALC.compute(recipe);
			}catch(err){
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


			if(!bml){
				return;
			}

			self.editor.setValue(bml);

		}
	});

}());
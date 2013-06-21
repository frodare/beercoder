/* globals BREWCALC, CodeMirror, BML */

(function() {
	'use strict';
	var display = $('.beer-results .content');
	


	var fieldnames = ['fg-section','og-section','ibu-section','srm-section','glass','glbs','hoz', 'cal12oz', 'abv', 'buog-est', 'buog-avg', 'og-est', 'og-min','og-max', 'fg-est', 'fg-min','fg-max', 'srm-est', 'srm-min','srm-max', 'ibu-est', 'ibu-min','ibu-max'];
	var fields = {};

	$.each(fieldnames, function (i, name) {
		fields[name] = display.find('.' + name);
	});
	
	function setWarn(field, attr) {
		if(attr.min && attr.max) {
			if(attr.est > attr.max || attr.est < attr.min) {
				field.addClass('warn').removeClass('nominal');
			}else{
				field.addClass('nominal').removeClass('warn');
			}
		}
	}

	function render(d) {
		console.log(d);
		fields.glbs.text(d.glbs);
		fields.hoz.text(d.hoz);
		fields.cal12oz.text(d.cal12oz);
		fields.abv.text(d.abv);
		
		fields['og-min'].text(d.og.min);
		fields['og-max'].text(d.og.max);
		fields['og-est'].text(d.og.est);
		setWarn(fields['og-section'], d.og);


		fields['fg-min'].text(d.fg.min);
		fields['fg-max'].text(d.fg.max);
		fields['fg-est'].text(d.fg.est);
		setWarn(fields['fg-section'], d.fg);


		fields['srm-min'].text(d.srm.min);
		fields['srm-max'].text(d.srm.max);
		fields['srm-est'].text(d.srm.est);
		setWarn(fields['srm-section'], d.srm);


		fields['ibu-min'].text(d.ibu.min);
		fields['ibu-max'].text(d.ibu.max);
		fields['ibu-est'].text(d.ibu.est);
		setWarn(fields['ibu-section'], d.ibu);

		fields['buog-est'].text(d.buog.est);
		fields['buog-avg'].text(d.buog.avg);


		//fields.glass.css('backgroundColor', d.srm.color);

		/*
		<div class="glass" style="background-image: -webkit-gradient(linear, left top, left bottom, from(rgba(200, 155, 50, 1)),   to(rgba(200, 155, 50, 0.3)) );">
								<div class="glass-overlay"></div>
							</div>*/


		//console.log(d.srm.color);
		
		var c, c1, c2;


		if(d.srm.est && d.srm.est > 0){
			c = BREWCALC.units.convert('SRM', 'HTML_RGB', d.srm.est);
			c1 = BREWCALC.units.convert('SRM', 'HTML_RGB', d.srm.est + 1);
			c2 = BREWCALC.units.convert('SRM', 'HTML_RGB', Math.max(d.srm.est - (d.srm.est/4 + 1),0));
		}else{
			c1 = c2 = c = '#FFFFFF';
		}
		

		console.log(c);
		fields.glass.css('backgroundColor', c);
		fields.glass.css('backgroundImage', '-webkit-gradient( linear, left top, left bottom, from(' + c1 + '),   to(' + c2 + ') )');

		// fields.xxx.text(d.xxx);
		// fields.xxx.text(d.xxx);
		// fields.xxx.text(d.xxx);
		// fields.xxx.text(d.xxx);
		// fields.xxx.text(d.xxx);
		// fields.xxx.text(d.xxx);
		// fields.xxx.text(d.xxx);
	}
		/*
			$('#bml').bmlParser({
				update: function (ev, recipe) {
					var stats = BREWCALC.compute(recipe);
					
					display.html($.tmpl('results', {
						stats: stats,
						color: BREWCALC.units.convert('SRM', 'HTML_RGB', stats.srm) 
					}));

				}
			});*/



	CodeMirror.commands.autocomplete = function(e) {
		CodeMirror.simpleHint(e, CodeMirror.bmlHint);
	};


	


	function read(namespace, path) {
		var i, a = path.split('.');
		for(i = 0; i < a.length; i += 1) {
			var key = a[i];
			if(key.match(/^[0-9]{1,3}$/)) {
				key = parseInt(key, 10);
			}
			if(key === 0 && !$.isArray(namespace)) {
				continue;
			}
			if(typeof namespace === "undefined") {
				return undefined;
			}
			namespace = namespace[key];
			if(i === a.length - 1 || typeof namespace === "undefined") {
				return namespace;
			}
		}
	}

	function formatSG(f) {
		if(!f) {
			return;
		}
		if(typeof(f) === 'number') {
			return f.toFixed(3);
		}
		return f;
	}

	var editor;

	function parse() {
		var val = editor.getValue();
		var recipe = BML.parse(val);


		var stats = BREWCALC.compute(recipe);



		var d = {
			srm: {
				style: 'nominal',
				est: stats.srm,
				min: read(recipe, 'info.style.srm.min'),
				max: read(recipe, 'info.style.srm.max'),
				color: BREWCALC.units.convert('SRM', 'RGB', stats.srm)
			},
			og: {
				style: 'nominal',
				est: formatSG(stats.og),
				min: formatSG(read(recipe, 'info.style.og.min')),
				max: formatSG(read(recipe, 'info.style.og.max'))
			},
			fg: {
				style: 'nominal',
				est: formatSG(stats.fg),
				min: formatSG(read(recipe, 'info.style.fg.min')),
				max: formatSG(read(recipe, 'info.style.fg.max'))
			},
			ibu: {
				style: 'nominal',
				est: stats.ibu,
				min: read(recipe, 'info.style.ibu.min'),
				max: read(recipe, 'info.style.ibu.max')
			},
			buog: {
				style: 'nominal',
				est: stats.buog,
				avg: read(recipe, 'info.style.bugu')
			},
			abv: stats.abv,
			cal12oz: stats.cal12oz,
			glbs: stats.glbs,
			hoz: stats.hoz
		};


		function check(attr) {
			if(attr.min && attr.max) {
				if(attr.est > attr.max || attr.est < attr.min) {
					attr.style = 'warn';
				}
			}
		}

		check(d.srm);
		check(d.og);
		check(d.fg);
		check(d.ibu);

		/*
		display.html($.tmpl('results', {
			disp: d
		}));
		*/

		render(d);


		/*
		 * update editor gutter values
		 */
		$('.gutter-info').remove();

		setTimeout(function() {
			//console.log($('.cm-grain:visible'));
			$('pre .cm-grain:nth-child(1)').each(function(i, e) {
				var grainLine = $(e);
				var offset = grainLine.position();
				//hack, fixme
				if(offset.top < 10) {
					return;
				}

				var info = $('<div class="gutter-info"></div>');

				var amount = BREWCALC.toDecimal(grainLine.text().replace(/^\s*([0-9.\/]+)/, '$1'));

				var percent = (100 * amount / stats.glbs).toFixed(1);

				info.html(percent + '%');

				info.css({
					top: offset.top
				});

				grainLine.parents('div').first().after(info);

			});


			$('pre .cm-hops:nth-child(1)').each(function(i, e) {
				var line = $(e);
				var offset = line.position();
				//hack, fixme
				if(offset.top < 10) {
					return;
				}

				var info = $('<div class="gutter-info"></div>');

				var amount = BREWCALC.toDecimal(line.text().match(/\s*([0-9.\/]+)\s*oz/)[1]);


				var percent = (100 * amount / stats.hoz).toFixed(1);

				console.log(amount);

				info.html(percent + '%');

				info.css({
					top: offset.top
				});

				line.parents('div').first().after(info);

			});


		}, 0);


	}


	function loadEditor(el){
		
		
		parse();
	}

	function tmpl(id) {
		return $('#' + id).clone().removeAttr('id');
	}

	$.widget("beerCoder.recipeParameter", {
		
		_create: function(){
			var self = this,
				e = self.element,
				o = self.options;

			tmpl('tmplRecipeParameter').appendTo(e);
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

			tmpl('tmplRecipeCard').appendTo(e);
			self._buildEditor();
			self._buildParameters();
			self.set(o.bml);
		},

		_buildEditor: function () {
			var self = this,
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
		},

		_buildParameters: function () {
			var self = this,
				e = self.element,
				specs = e.find('.primaryBeerSpecs'),
				paramVals = {
					og: specs.find('.spec-og').recipeParameter(),
					fg: specs.find('.spec-fg').recipeParameter(),
					ibu: specs.find('.spec-ibu').recipeParameter(),
					srm: specs.find('.spec-srm').recipeParameter(),
					bugu: specs.find('.spec-bugu').recipeParameter()
				};

			e.on('recipecardchange', null, function () {
				var recipe = self.recipe,
					stats = self.stats,
					style = recipe.info.style;

				console.log('recipe', recipe);


				var codes = ['og', 'fg', 'ibu', 'srm'];

				$.each(codes, function (i, paramCode) {
					var paramVal = {};
					if($.isPlainObject(style)){
						paramVal.min = style[paramCode].min;
						paramVal.max = style[paramCode].max;
					}
					paramVal.est = stats[paramCode];
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
				paramVal.est = stats[paramCode];
				paramVal.label = paramCode;
				paramVals[paramCode].recipeParameter('set', paramVal);

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

			self._trigger('change');

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
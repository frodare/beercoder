/*globals define*/
define(["jquery", "doT!statsdisplay", "brewcalc", "jqueryui"], function ($, tmpl, brewcalc) {
	'use strict';

	var defaultStats ={
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
			glbs:0,
		},
		defaultStyle = {
			style:'',
			category:'',
			abv:{
				min:'',
				max:''
			},
			ibu:{
				min:'',
				max:''
			},
			srm:{
				min:'',
				max:''
			},
			og:{
				min:'',
				max:''
			},
			fg:{
				min:'',
				max:''
			},
			aparent_attenuation:'',
			bugu:''
		};

	$.widget("beercoder.statsdisplay", {

		_create: function(){
			var self = this,
				e = self.element;

			e.empty();
		},

		draw: function () {
			var self = this,
				e = self.element;

			var drawdata = {
				style: self.style,
				stats: self.stats,
				glasscss: self.glasscss
			};

			e.html(tmpl(drawdata));
		},

		set: function (styleAndstats) {
			var self = this,
				e = self.element;
			
			self.stats = $.extend(true, {}, defaultStats, styleAndstats.stats);
			self.style = $.extend(true, {}, defaultStyle, styleAndstats.style);
			

			$.each(self.style, function (paramerter, guide) {
				if(!(guide && guide.min && guide.max)){
					return;
				}

				var stat = self.stats[paramerter];

				if(stat !== 0 && !stat){
					return;
				}

				if(stat > guide.max || stat < guide.min){
					self.style[paramerter].css = 'error';
				}else{
					self.style[paramerter].css = 'nominal';
				}

			});

			/*
			var color = brewcalc.units.convert('SRM', 'RGB', (stats && stats.srm || 0));
			paramVals.glass.css({
				'backgroundColor': brewcalc.units.convert('SRM', 'HTML_RGB', (stats && stats.srm || 0)),
				'boxShadow': '0 0 20px rgba(' + color.r + ', ' + color.g + ', ' + color.b + ',1)'
			});*/
				
			var srm = (self.stats && self.stats.srm) || 0;

			/*var rgbcolor = brewcalc.units.convert('SRM', 'RGB', srm);*/
			var htmlcolor = brewcalc.units.convert('SRM', 'HTML_RGB', srm);

			self.glasscss = 'background-color:' + htmlcolor + ';';

			self.draw();
		},

		clear: function () {
			this.set();
		}
	});
});

/*globals define*/
define(["jquery", "doT!statsdisplay", "jqueryui"], function ($, tmpl) {
	'use strict';

	var defaultStats = {
			og:'',
			fg:'',
			glbs:'',
			hoz:'',
			ibu:'',
			abv:'',
			abw:'',
			srm:'',
			bugu:'',
			cal12oz:''
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

			e.html(tmpl({
				style: self.style,
				stats: self.stats
			}));
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

			self.draw();
		},

		clear: function () {
			this.set();
		}
	});
});

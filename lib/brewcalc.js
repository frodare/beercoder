/*
 * jsBrewCalc
 */
/*global define */

define(['jquery'], function ($) {
	'use strict';


	var calc = {
		settings: {
			eff: 0.75,
			colorEff: 0.66,
			defaultAtt: 0.73
		}
	};

	/*
	 * Number reading: needs much improvement
	 */

	function toDecimal(v) {
		var d;
		var s = v.replace(/^([0-9.\/]+).*/, '$1');

		if (s.match(/\//)) {
			var a = s.split('/');
			d = parseFloat(a[0], 10) / parseFloat(a[1], 10);
		} else {
			d = parseFloat(s, 10);
		}

		return d;
	}

	calc.toDecimal = toDecimal;

	//http://realbeer.com/hops/research.html#table
	var tinseth = function(og, time, amount, aa, vol) {
		var ibu = 0;

		//FIXME: assume preboil
		var preboil = og * 0.98;

		amount = toDecimal(amount);

		var bignessFactor = 1.65 * Math.pow(0.000125, (preboil - 1));



		var timeFactor = (1 - Math.pow(Math.E, (-0.04 * time))) / 4.15;

		var aaFactor = ( aa * amount * 7490 )/vol;

		

		ibu += aaFactor * bignessFactor * timeFactor;


		return ibu;
	};


	function toPlato(g) {
		return (-463.37) + (668.72 * g) - (205.35 * Math.pow(g,2)) ;
	}

	calc.compute = function(recipe) {

		var volume = parseFloat(recipe.info.size, 10);
		if (!volume) {
			throw new Error('recipe.info.size is required');
		}



		var gu = 0,
			glbs = 0,
			hoz = 0,
			srmu = 0;


		/*
		 *  gravity
		 */
		$.each(recipe.grain, function(i, grain) {
			if (grain.unit !== 'lb' && grain.unit !== 'lbs') {
				console.log('ignore grain unit not "lb/s"');
				return;
			}
			var amount = parseFloat(grain.amount, 10);
			gu += amount * grain.ppg;
			glbs += amount;
			srmu += grain.color * amount;
		});

		var eff = calc.settings.eff;

		if(recipe.info.efficiency){
			eff = toDecimal(recipe.info.efficiency)/100;
			if(isNaN(eff)){
				eff = calc.settings.eff;
			}
		}

		var gut = (gu / volume) * eff;


		var attenuation = calc.settings.defaultAtt;
		var yeast;
		if(recipe.yeast.length > 0){
			yeast = recipe.yeast[0];
			if(yeast.att){
				attenuation = yeast.att;
			}
		}

		//TODO: need pre boil gravity
		var og = 1 + (gut / 1000);
		var fg = 1 + (gut * (1 - attenuation)) / 1000;

		/*
		 * hops
		 */

		var ibu = 0;
		var bignessFactor = 1.65 * Math.pow(0.000125, (og - 1));
		$.each(recipe.hops, function(i, hop) {
			hoz += toDecimal(hop.amount);
			ibu += tinseth(og, hop.min, hop.amount, hop.aa, volume);
		});


		//TODO: use an average of og and og pre-boil


		var buog =  ibu / gut;

		var abv = ((1.05*(og-fg))/fg)/0.79*100;
		var abw = (0.79 * abv) / fg;


		var realExtract = (0.1808 * toPlato(og)) + (0.8192 * toPlato(fg));
		var cal12oz = ((6.9 * abw) + 4.0 * (realExtract - 0.10)) * fg * 3.55;


		/*
		 * Color
		 * may darken 2-3 due to oxidation and caramelization
		 */

		var srm = calc.settings.colorEff * srmu / volume;

		var stats = {
			og: og.toFixed(3),
			fg: fg.toFixed(3),
			glbs: glbs.toFixed(1),
			hoz: hoz.toFixed(1),
			ibu: Math.round(ibu),
			abv: abv.toFixed(1),
			abw: abw.toFixed(1),
			srm: Math.round(srm),
			buog: buog.toFixed(2),
			bugu: buog.toFixed(2),
			cal12oz: Math.round(cal12oz)
		};

		return stats;

	};

	return calc;

});

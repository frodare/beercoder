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
		if(isNaN(buog)){
			buog = 0;
		}else{
			buog = buog.toFixed(2);
		}

		var abv = ((1.05*(og-fg))/fg)/0.79*100;
		var abw = (0.79 * abv) / fg;


		var realExtract = (0.1808 * toPlato(og)) + (0.8192 * toPlato(fg));
		var cal12oz = ((6.9 * abw) + 4.0 * (realExtract - 0.10)) * fg * 3.55;


		/*
		 * Color
		 * may darken 2-3 due to oxidation and caramelization
		 */

		var srm = calc.settings.colorEff * srmu / volume;


		if(cal12oz < 0){
			cal12oz = 0;
		}

		var stats = {
			og: og.toFixed(3),
			fg: fg.toFixed(3),
			glbs: glbs.toFixed(1),
			hoz: hoz.toFixed(1),
			ibu: Math.round(ibu),
			abv: abv.toFixed(1),
			abw: abw.toFixed(1),
			srm: Math.round(srm),
			buog: buog,
			bugu: buog,
			cal12oz: Math.round(cal12oz)
		};

		return stats;

	};

	/*
	 * reading = measured gravity
	 * tr = temperature at time of reading
	 * tc = calibration temperature of hydrometer
	 */
	calc.hydrometerCorrection = function (reading, tr, tc) {
		var A1 = reading,
			A2 = tr,
			A3 = tc;
		return A1*((1.00130346-0.000134722124*A2+0.00000204052596*Math.pow(A2,2)-0.00000000232820948*Math.pow(A2,3))/(1.00130346-0.000134722124*A3+0.00000204052596*Math.pow(A3,2)-0.00000000232820948*Math.pow(A3,3)));
	};

	calc.refractometerToSG = function (brix) {
		return 1.000019 + (0.003865613 * brix + 0.00001296425 * brix + 0.00000005701128 * brix);
	};

	/*
	 * Load units
	 */
	calc.units = (function() {
		var u, addUnit, createBaseUnit, createPowerUnit, createFactorUnit;

		u = {};

		createBaseUnit = function() {
			return {
				from: function(val) {
					return val;
				},
				to: function(val) {
					return val;
				}
			};
		};

		createPowerUnit = function(base, factor) {
			return {
				base: base,
				from: function(val) {
					return val * Math.pow(10, factor);
				},
				to: function(val) {
					return val / Math.pow(10, factor);
				}
			};
		};

		createFactorUnit = function(base, factor) {
			return {
				base: base,
				from: function(val) {
					return val / factor;
				},
				to: function(val) {
					return val * factor;
				}
			};
		};

		/* create base units and base units with scalers (g, kg, mg, ...) */
		var prefixes = ['', 'k', 'c', 'm'];
		var factors = [0, 3, -2, -3];
		var units = ['g', 'l', 'm'];
		var j, i;
		for (j = 0; j < units.length; j++) {
			var base = units[j];
			for (i = 0; i < prefixes.length; i++) {
				if (prefixes[i]) {
					u[prefixes[i] + base] = createPowerUnit(base, factors[i]);
				} else { /* base unit */
					u[base] = createBaseUnit();
				}
			}
		}

		//TODO: check factors here http://scphillips.com/units/convfact.html
		/*
		 * Volume
		 */
		u['fl_oz'] = createFactorUnit('l', 33.81402266);
		u['pt'] = createFactorUnit('l', 2.11337642);
		u['qt'] = createFactorUnit('l', 1.05668821);
		u['gal'] = createFactorUnit('l', 0.26417205);


		/*
		 * Volume
		 */
		u['lb'] = createFactorUnit('g', 0.002204622622);
		u['oz'] = createFactorUnit('g', 0.03527);

		/*
		 * Volume
		 */

		/*
		 * Temperature
		 */
		u['C'] = createBaseUnit();

		u['F'] = {
			base: 'C',
			from: function (F) {
				return  (F - 32) / 1.8;
			},
			to: function (C) {
				return (C * 1.8) + 32;
			}
		};
		u['K'] = {
			base: 'C',
			from: function (K) {
				return  K - 273.15;
			},
			to: function (C) {
				return C  + 273.15;
			}
		};


		/*
		* Beer Color
		*/
		u['SRM'] = createBaseUnit();

		/*
		 * RGB Color Unit
		 */

		(function() {
			function poly(aCoef, x) {
				var i, out = 0;
				for (i = 0; i < aCoef.length; i++) {
					out += aCoef[i] * Math.pow(x, i);
				}
				if (out > 255) {
					out = 255;
				} else if (out < 0) {
					return 0;
				}
				return parseInt(out, 10);
			}

			/*
			 * SRM formula fitted from values in this XML table: http://www.barleydogbrewery.com/xml/colors.xml
			 */

			function red(srm) {
				return poly([238.6303585006, 17.6108782693, -8.9883800316, 1.3709404563, -0.1002066713, 0.0037034703, -0.0000669932197182277, 0.000000472459865365479], srm);
			}

			function green(srm) {
				return poly([236.4190457383, 24.5851535763, -11.2609108061, 1.3928617335, -0.085670751, 0.0028098906, -0.0000468322823271471, 0.000000311720440784933], srm);
			}

			function blue(srm) {
				return poly([246.8168629488, -133.9153654594, 29.8154633754, -3.0816135668, 0.1688592584, -0.0050872708, 0.0000796771402841231, -0.000000507065454065039], srm);
			}


			u['RGB'] = {
				base: 'SRM',
				from: function(val) {
					throw new Error('RGB to SRM not yet supported');
				},
				to: function(srm) {
					return {
						r: red(srm),
						g: green(srm),
						b: blue(srm)
					};
				}
			};

		}());

		/* hex routine from here: http://methodbrewery.com/srm.php */
		//TODO: there should be a better way to do hex conversion
		var hexDigits = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");

		function hex(x) {
			return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
		}

		u['HTML_RGB'] = {
			base: 'SRM',
			from: function() {
				throw new Error('HTML_RGB to SRM not yet supported');
			},
			to: function(val) {
				var rgb = u.RGB.to(val);
				if(val > 40){
					return '#000';
				}
				return '#' + hex(rgb.r) + hex(rgb.g) + hex(rgb.b);
			}
		};


		u.convert = function (fromUnit, toUnit, val) {
			var fromBase, toBase;
			fromBase = u[fromUnit].base || fromUnit;
			toBase = u[toUnit].base || toUnit;
			if(fromBase !== toBase){
				throw new Error('Invalid unit convertion, base unit missmatch [' + fromBase + '] != [' + toBase + ']');
			}
			return u[toUnit].to(u[fromUnit].from(val));
		};

		return u;
	}());

	return calc;

});

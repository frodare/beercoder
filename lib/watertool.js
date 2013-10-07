/*globals define*/
define(["jquery", "doT!watertool", "brewcalc", "brewcalc-water", "jqueryui"], function ($, tmpl, brewcalc) {
	'use strict';

	$.widget('beercoder.watertool', {
		
		options: {
			profiles: []
		},

		_create: function () {
			var self = this, 
				e = this.element;
			
			e.html(tmpl()).addClass('simple-water-calculator');

			//self.raTargetValue = e.find('.ra-target-value');
			//self.raTreatedValue = e.find('.ra-treated-value');

			self.result = e.find('.result');

			self.volumeInput = e.find('input[name="volume"]').numberInput().on('keyup', function () {
				self.update();
			});


			self.waterProfileInputs = e.find('.water-profile input').numberInput().on('keyup', function () {
				self.update();
			});

			/*
			self.srmSlider = e.find('.srm-slider').slider({
				value: 10,
				min: 2,
				max: 40,
				step: 0.1
			}).on('slide', function (ev) {
				self.updateSrm();
			});
			*/

			self.logButton = e.find('button.log').on('click', function (ev) {
				ev.preventDefault();
				var s = 'Water Adjustment (' + self.volume + ' gallons)';
				s += '\n- ' + self.CaCltsp + ' tsp Calcium Chloride';
				s += '\n- ' + self.CaSOtsp + ' tsp Gypsum';
				$(document).trigger('bmlappendnote', [s]);
			});

			self.ratioValue = e.find('.ratio-slider-info .value');
			self.ratioDescription = e.find('.ratio-slider-info .description');

			//Chloride:Sulfate ratio
			self.maltBalanceSlider = e.find('.malt-balance-slider').slider({
				min: -10,
				max: 10,
				step: 1
			}).on('slide', function (ev) {
				self.update();
			});
			//self.setBalance(self.maltBalanceSlider.slider( "option", "value" ));

			self.update();
			//self.updateSrm();
			//self.updateBalance();
		},

		update: function () {
			var self = this;

			self.waterProfile = {};
			self.balanceRatio = self.toRatio(self.maltBalanceSlider.slider( "option", "value" ));
			self.volume = self.volumeInput.val();

			self.waterProfileInputs.each(function () {
				var v = $(this),
					val = +v.val();

				if(isNaN(val)){
					val = 0;
				}

				self.waterProfile[v.attr('name')] = val;
			});

			

			self.compute();

			//self.raTargetValue.html(self.raTarget);
			//self.raTreatedValue.html(self.raTreated);

			self.ratioValue.html('Chloride:Sulfate: ' + self.balanceRatio);
			self.ratioDescription.html(self.toDescription(self.balanceRatio));
		},

		setSrm: function (srm) {
			var self = this;
			self.srm = srm;
			self.raTarget = brewcalc.water.computeRaFromColor(srm);
			self.update();
		},

		setBalance: function(ratio)  {
			var self = this;
			self.balanceRatio = self.toRatio(ratio);
			self.update();
		},
		

		toRatio: function(rangeValue) {
			if (rangeValue > 0) {
				return rangeValue;
			} else if (rangeValue < 0) {
				return -Math.round(100 / rangeValue) / 100;
			} else {
				return 1;
			}
		},

		toDescription: function(ratio) {
			if (ratio > 2) {
				return 'very malty';
			} else if (ratio > 1.3) {
				return 'malty';
			} else if (ratio > 0.77) {
				return 'balanced';
			} else if (ratio > 0.5) {
				return 'bitter';
			} else {
				return 'very bitter';
			}
		},

		

		compute: function () {
			var self = this,
				round = brewcalc.util.round,
				w = brewcalc.water,
				r = self.balanceRatio,
				ra = round(self.raTarget,0),
				ca = w.caRequired(ra, self.waterProfile),
				salts = w.caSaltsRequired(ca, r, self.waterProfile)

			var newWater = w.adjustWaterWithSalts(salts, self.waterProfile),
				newRA = round(parseInt(w.toRA(newWater), 10),0);
			
			self.raTreated = newRA;

			var CaSOgrams = salts.CaSO * self.volume;
			var CaSOtsp = CaSOgrams / w.salts.CaSO.tsp;
			

			var CaClgrams = salts.CaCl * self.volume;
			var CaCltsp = CaClgrams / w.salts.CaCl.tsp;

			self.CaCltsp = round(CaCltsp, 1);
			self.CaSOtsp = round(CaSOtsp, 1);

			var result = '';

			/*
			 * CaSO addition
			 */
			result += '<div class="result-entry">';
			result += '<span class="main-value"><span class="amount">' + round(CaSOtsp, 1) + '</span> tsp Gypsum</span>';
			result += '<span class="additional-value"> (' + round(CaSOgrams, 2) + 'g CaSO<sub>4</sub>)</span>';
			result += '</div>';

			/*
			 * CaCl addition
			 */
			result += '<div class="result-entry">';
			result += '<span class="main-value"><span class="amount">' + round(CaCltsp, 1) + '</span> tsp Calcium Chloride</span>';
			result += '<span class="additional-value"> (' + round(CaClgrams, 2) + 'g CaCl<sub>2</sub>)</span>';
			result += '</div>';

			function addwarning(ion) {

				if(ion === 'ra'){
					if(ra !== newRA){
						return ' warn';
					}
					return '';
				}

				if(newWater[ion] > brewcalc.water.ions[ion].max){
					return ' warn';
				}
				return '';
			}

			/*
			 * treated water profile
			 */
			result += '<div class="treated-water-profile">Treated: ';
			result += '<span class="label">Ca</span> <span class="value' + addwarning('Ca') + '">' + round(newWater.Ca, 0) + '</span> ';
			result += '<span class="label">Mg</span> <span class="value">' + round(newWater.Mg, 0) + '</span> ';
			result += '<span class="label">SO</span> <span class="value' + addwarning('SO') + '">' + round(newWater.SO, 0) + '</span> ';
			result += '<span class="label">Na</span> <span class="value">' + round(newWater.Na, 0) + '</span> ';
			result += '<span class="label">Cl</span> <span class="value' + addwarning('Cl') + '">' + round(newWater.Cl, 0) + '</span>';
			result += '<span class="label">HCO</span> <span class="value">' + round(newWater.HCO, 0) + '</span>';
			result += '<span class="label">RA</span> <span class="value' + addwarning('ra') + '">' + newRA + '</span>';
			result += '</div>';

			self.result.html(result);

			/*
			self.result.append('<BR><BR><div><b>RA</b>: ' + newRA + '</div>');
			self.result.append('<div><b>Chloride:Sulfate</b>: ' + r + '</div>');
			//result.append('<div><b>Est. Mash PH</b>: ' + w.raToPh(ra) + '</div>');

			if(newWater.Ca >= w.ions.Ca.max || (salts.CaSO + salts.CaCl) <= 0){
				self.result.css({
					color: 'red'
				});
			}else{
				self.result.css({
					color: 'black'
				});
			}
			*/
		}
	

	});


	

	



	

	
});

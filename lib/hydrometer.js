/*globals define*/
define(["jquery", "doT!hydrometer", "brewcalc", "moment", "jqueryui"], function ($, tmpl, brewcalc, moment) {
	'use strict';

	$.widget("beercoder.hydrometer", {
		_create: function () {
			var self = this,
				o = self.options,
				e = self.element;
			
			e.html(tmpl());

			e.addClass('hydrometer-widget');


			self.readingInput = e.find('input[name="reading"]').numberInput({
				increment: 0.001,
				round: 3
			});
			self.tempInput = e.find('input[name="temperature"]').numberInput();
			self.calInput = e.find('input[name="calibration"]').numberInput();
			
			self.logButton = e.find('button.log').on('click', function (ev) {
				ev.preventDefault();
				$(document).trigger('bmlappendnote', [self.valueDisplay.text() + ' at ' + moment().format('LT')]);
			});


			e.on('change keyup', function (ev) {
				self.read();
			});

			self.valueDisplay = e.find('.sg-value');

			self.read();
		}, 

		read: function () {
			var self = this,
				val = brewcalc.hydrometerCorrection(+self.readingInput.val(), +self.tempInput.val(), +self.calInput.val());

			self.valueDisplay.text(val.toFixed(3));
		}

	});
});

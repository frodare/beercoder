/*globals define*/
define(["jquery", "doT!refractometer", "brewcalc", "moment", "jqueryui"], function ($, tmpl, brewcalc, moment) {
	'use strict';

	$.widget("beercoder.refractometer", {
		_create: function () {
			var self = this,
				o = self.options,
				e = self.element;
			

			e.html(tmpl());

			e.addClass('refractometer-widget');

			self.readingInput = e.find('input[name="reading"]').numberInput({
				increment: 0.1,
				round: 1
			});
			
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
				val = brewcalc.refractometerToSG(+self.readingInput.val());

			self.valueDisplay.text(val.toFixed(3));
		}

	});
});

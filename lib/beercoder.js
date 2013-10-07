/*globals define*/
define(["jquery", "doT!beercoder", "bmleditor", "statsdisplay", "brewtimer", "hydrometer", "refractometer", "watertool", "jqueryui"], function ($, tmpl) {
	'use strict';

	$.widget('beercoder.numberInput', {

		options: {
			increment: 1,
			round: 0
		},

		_create: function () {
			var self = this,
				inc = self.options.increment,
				round = self.options.round,
				e = self.element;

			e.on('keydown', function (ev) {
				var c = ev.which,
					mInc = inc;

				if(ev.shiftKey){
					mInc = inc * 10;
				}

				if(c === 107 || c === 38 || c === 187){
					e.val((+e.val() + mInc).toFixed(round));
					ev.preventDefault();
					return false;
				}else if(c === 109 || c === 40 || c === 189){
					e.val((+e.val() - mInc).toFixed(round));
					ev.preventDefault();
					return false;
				}
			});
		}

	});

	$.widget('beercoder.toolSection', {

		options: {
			increment: 1,
			round: 0
		},

		_create: function () {
			var self = this,
				e = self.element;

			self.body = e.find('.tool-body');

			e.find('.tool-header').on('click', function () {
				self.toggle();
			});

			self.close();
		},

		close: function () {
			var self = this;
			self.isOpen = false;
			self.body.hide();
			self.element.addClass('closed');
		},

		open: function () {
			var self = this;
			self.isOpen = true;
			self.body.show();
			self.element.removeClass('closed');
		},

		toggle: function () {
			var self = this;
			if(self.isOpen){
				self.close();
			}else{
				self.open();
			}
		}

	});

	$.widget("beercoder.beercoder", {

		_create: function(){
			var self = this,
				o = self.options,
				e = self.element;

			e.html(tmpl());

			var editor = e.find('.bmleditor'),
				stats = e.find('.statsdisplay'),
				boiltimer = e.find('.boiltimer'),
				hydrometer = e.find('.hydrometer'),
				refractometer = e.find('.refractometer'),
				watertool = e.find('.watertool');

			self.editor = editor.bmleditor({
				change: function (ev, data) {
					self.onChange(data);
				}
			});

			self.stats = stats.statsdisplay();
			self.boilTimer = boiltimer.brewtimer();
			self.hydrometer = hydrometer.hydrometer();
			self.refractometer = refractometer.refractometer();
			self.watertool = watertool.watertool();

			e.find('.beertool').toolSection();

			if(o.bml){
				self.set(o.bml);
			}
		},

		onChange: function (data) {
			var self = this,
				e = self.element,
				stats = (data && data.stats) || {},
				style = (data && data.recipe && data.recipe.info && data.recipe.info.style) || {};

			self.stats.statsdisplay('set', {
				stats: stats,
				style: style
			});

			self.boilTimer.brewtimer('set', data && data.recipe);
			self.watertool.watertool('setSrm', stats && stats.srm);

			self._trigger('change', null, data);
		},

		set: function (bml) {
			var self = this;
			self.editor.bmleditor('set', bml);
		},

		get: function () {
			var self = this;
			return self.editor.bmleditor('get');
		}

	});
});

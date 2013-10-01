/*globals define*/
define(["jquery", "doT!beercoder", "bmleditor", "statsdisplay","jqueryui"], function ($, tmpl) {
	'use strict';

	$.widget("beercoder.beercoder", {

		_create: function(){
			var self = this,
				e = self.element;

			e.html(tmpl());


			var editor = e.find('.bmleditor'),
				stats = e.find('.statsdisplay');

			self.editor = editor.bmleditor({
				change: function (ev, data) {
					self.onChange(data);
				}
			});

			self.stats = stats.statsdisplay();
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
		},

		set: function (bml) {
			var self = this;
			self.editor.bmleditor('set', bml);
		},

		get: function () {
			var self = this;
			self.editor.bmleditor('get');
		}

	});
});

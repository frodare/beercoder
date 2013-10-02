/*globals define*/
define(["jquery", "doT!loginwidget", "jqueryui"], function ($, tmpl) {
	'use strict';

	var ajax = function (command, data) {
		data = data || {};
		return $.ajax({
			url: "/repo/" + command,
			type: "POST",
			dataType: "json",
			processData: false,
			contentType: "application/json; charset utf-8",
			data: JSON.stringify(data)
		});
	};

	$.widget("beerCoder.loginwidget", {
		_create: function(){
			var self = this,
				e = self.element,
				o = self.options;

			e.html(tmpl()).addClass('login-widget');

			self.displayName = e.find('.display-name');
			self.recipeSelect = e.find('select[name="recipes"]');

			self.saveButton = e.find('button.save');
			self.nameInput = e.find('input[name="recipeName"]');

			self.update().done(function () {
				self.updateList();
			});
		},

		updateList: function () {
			var self = this;
			ajax('list').done(function (resp) {
				var select = self.recipeSelect;

				select.empty();

				if(!resp.length){
					select.hide();
					return;
				}

				$.each(resp, function (i, recipe) {
					select.append('<option>' + recipe.name + '</option>');
				});

				select.show();
			});
		},

		update: function () {
			var self = this;

			console.log('update connection display');

			return ajax('status').done(function (resp) {
				self.user = resp.user;
				self.showUser();
			}).fail(function (err) {
				console.log('Status check failed', err);
				self.showLogin();
			});
		},

		showUser: function () {
			var self = this;
			self.displayName.text(self.user.displayName);
			self.recipeSelect.show();
			self.saveButton.show();
			self.nameInput.show();

			self.saveButton.on('click', function (ev) {
				ev.preventDefault();
				self.save(self.nameInput.val());
			});
		},

		showLogin: function () {
			var self = this;
			console.log('display login');
			self.displayName.html('<a href="/auth/facebook">Login with Facebook</a>');
			self.recipeSelect.hide();
			self.saveButton.hide();
			self.nameInput.hide();
		}/*,

		save: function (name) {
			var self = this;

			console.log('saving ', name);

			var recipeData = BEERCODER.editor.recipeCard('getData');

			recipeData.name = name;

			return BEERCODER.ajax('save', recipeData).pipe(function (resp) {
				var dfd = $.Deferred();
				if(!resp.user){
					dfd.reject('not logged in');
				}else{
					dfd.resolve(resp);
				}
				return dfd;
			});
		}*/

	});
});

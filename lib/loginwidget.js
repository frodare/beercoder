/*globals define*/
define(["jquery", "doT!loginwidget", "jqueryui"], function ($, tmpl) {
	'use strict';

	var storage = window.localStorage;

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

	function getName(data) {
		return data && data.recipe && data.recipe.info && data.recipe.info.name;
	}

	var read = function(namespace, domKey) {
		
		if(namespace === undefined){
			return;
		}

		if(domKey === undefined || domKey === ''){
			return namespace;
		}

		var i, a = domKey.toString().split('.');
		for(i = 0; i < a.length; i += 1) {
			var key = a[i];
			if(key.match(/^[0-9]{1,3}$/)) {
				/*
				 * treat this as an array index
				 */
				key = parseInt(key, 10);
			}

			/*
			 * arrays with index might be pulled out of the array, so check if we can find the correct mapping without the array
			 */
			if(key === 0 && !$.isArray(namespace)) {
				continue;
			}

			if(namespace === undefined || namespace === null) {
				return undefined;
			}

			namespace = namespace[key];

			if(i === a.length - 1 || namespace === undefined) {
				return namespace;
			}

		}
	};

	var s = function (namespace, domKey) {
		return read(namespace, domKey) || '';
	};

	var defaultRecipe = '--INFO------------------------------\n';
		defaultRecipe += 'name: Demo Recipe\n';
		defaultRecipe += 'style: 10A 2008 American Pale Ale\n';
		defaultRecipe += 'brewers: \n';
		defaultRecipe += 'size: 5 gallons\n';
		defaultRecipe += 'efficiency: 70%\n';
		defaultRecipe += '\n';
		defaultRecipe += '--GRAIN-----------------------------\n';
		defaultRecipe += '9 lbs American 2 row [1.8L 37PPG]\n';
		defaultRecipe += '1 lbs Crystal 60 Malt [60L 34PPG]\n';
		defaultRecipe += '\n';
		defaultRecipe += '--HOPS------------------------------\n';
		defaultRecipe += '40 min 1 oz Centennial [10%]\n';
		defaultRecipe += '10 min 1/2 oz Cascade (U.S.) [5%]\n';
		defaultRecipe += '5 min 1/2 oz Cascade (U.S.) [5%]\n';
		defaultRecipe += '\n';
		defaultRecipe += '--YEAST-----------------------------\n';
		defaultRecipe += '1pkg Safeale US-05 [73%]';

	$.widget("beerCoder.loginwidget", {
		_create: function(){
			var self = this,
				e = self.element,
				o = self.options;

			e.html(tmpl()).addClass('login-widget');

			self.displayName = e.find('.display-name');
			self.recipeSelect = e.find('select[name="recipes"]');

			self.saveButton = e.find('button.save');
			self.listButton = e.find('button.list');
			self.deleteButton = e.find('button.delete');
			self.copyButton = e.find('button.copy');

			self.loginLink = e.find('.login-link');



			var localSaveTimer;

			var startRecipe = storage.beercoderbml;
				
			if(!startRecipe){
				startRecipe = defaultRecipe;
			}

			$(document).on('beercoderchange', function (ev, data) {

				data._id = self.id;

				data.revision = (new Date()).getTime();

				if(self.ignoreNextChange){
					self.ignoreNextChange = false;
					console.log('ignored beercoder change');
					return;
				}

				/*
				 * store recipe in localcache
				 */
				if(localSaveTimer){
					clearTimeout(localSaveTimer);
				}
				localSaveTimer = setTimeout(function() {
					storage.beercoderdata = data;
				}, 500);
						
				
				self.dirty = true;
				self.updateDisplay();

				console.log('recipe ID:', self.id);

				self.data = data;
			});

			self.checkStatus().done(function () {
				self.updateList();
			});

			self.saveButton.on('click', function (ev) {
				ev.preventDefault();
				self.data._id = self.id;

				if(!self.id){
					console.log('NO ID GIVEN, saving new recipe');
				}

				self.save();
			});

			self.copyButton.on('click', function (ev) {
				var data = self.data;

				ev.preventDefault();
				delete data._id;

				if(!data.recipe){
					data.recipe = {};
				}

				if(!data.recipe.info){
					data.recipe.info = {};
				}

				if(!data.recipe.info.name){
					data.recipe.info.name = '';
				}

				data.recipe.info.name += ' (copy)';

				self.save();
			});

			self.deleteButton.on('click', function (ev) {
				ev.preventDefault();
				self.remove();
			});

			self.listButton.on('click', function (ev) {
				ev.preventDefault();
				self.list();
			});

			self.recipeSelect.on('change', function (ev) {
				var selectedRecipe = self.recipeSelect.find(':selected').data('beercoderdata') || {};
				self.id = selectedRecipe._id;
				self.ignoreNextChange = true;
				self.dirty = false;
				self._trigger('select', ev, selectedRecipe);
			});

			/*
			 * load up the recipe from the localcache
			 */
			self.data = storage.beercoderdata;
			if(self.data){
				self.id = self.data._id;
			}
			self._trigger('select', null, self.data);
		},
		
		updateList: function () {
			var self = this;
			return ajax('list').done(function (resp) {
				var select = self.recipeSelect;

				select.empty();

				if(!resp.length){
					select.hide();
					return;
				}

				$.each(resp, function (i, data) {
					var selected = '';
					if(data._id === self.id){
						selected = ' selected';
					}

					$('<option' + selected + '>' + s(data, ('recipe.info.name') || 'NO NAME') + ' (' + s(data, ('recipe.info.style.style')) + ')</option>').data('beercoderdata', data).appendTo(select);

				});

				select.show();
			});
		},

		updateDisplay: function () {
			

			var self = this,
				displayName = self.displayName.hide(),
				recipeSelect = self.recipeSelect.hide(),
				saveButton = self.saveButton.hide(),
				loginLink = self.loginLink.hide(),
				deleteButton = self.deleteButton.hide();
			
			console.log('update display', self.authed);

			if(self.authed){
				if(self.dirty){
					saveButton.show();
				}
				recipeSelect.show();
				if(self.id){
					deleteButton.show();
				}
				displayName.html(self.user.displayName).show();
			}else{
				loginLink.show();
			}
		},
		
		checkStatus: function () {
			var self = this;
			return ajax('status').done(function (resp) {
				self.user = resp.user;
				self.authed = true;
				self.updateDisplay();
			}).fail(function (err) {
				self.authed = false;
				self.updateDisplay();
			});
		},

		list: function () {
			var self = this;
			return ajax('list').pipe(function (resp) {
				var dfd = $.Deferred();
				if(!resp.user){
					dfd.reject('not logged in');
				}else{
					dfd.resolve(resp);
				}
				return dfd;
			});
		},

		remove: function () {
			var self = this,
				recipeSelect = self.recipeSelect;

			if(self.data){
				self.data._id = self.id;
			}

			console.log('deleting ', self.data);

			return ajax('delete', self.data).pipe(function (resp) {
				var dfd = $.Deferred();
				if(!resp.user){
					dfd.reject('not logged in');
				}else{
					//self._trigger('setid', null, resp._id);
					/*
					self.id = resp._id;
					self.dirty = false;
					self.updateDisplay();
					dfd.resolve(resp);
					*/
					return self.updateDisplay().done(function () {
						recipeSelect.val(recipeSelect.find('option:first').val());
					});
				}
				return dfd;
			}).done(function () {
				self.updateList();
			});
		},

		save: function () {
			var self = this;
			console.log('saving ', self.data);
			return ajax('save', self.data).pipe(function (resp) {
				var dfd = $.Deferred();
				if(!resp.user){
					dfd.reject('not logged in');
				}else{
					//self._trigger('setid', null, resp._id);
					self.id = resp._id;
					self.dirty = false;
					self.updateDisplay();
					dfd.resolve(resp);
				}
				return dfd;
			}).done(function () {
				self.updateList();
			});
		}

	});
});

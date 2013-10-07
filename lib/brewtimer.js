/*globals define*/
define(["jquery", "doT!brewtimer", "brewcalc", "moment", "jqueryui"], function ($, tmpl, brewcalc, moment) {
	'use strict';

	$.widget("beercoder.brewtimer", {

		options: {
			interval: 1000
		},
	
		_create: function () {
			var self = this,
				o = self.options,
				e = self.element;
			
			e.html(tmpl());

			e.addClass('brewtimer');

			self.notePrefix = 'Boil Started: ';

			self.timerDisplay = e.find('.timer');
			self.countDownDisplay = e.find('.countdown');
			self.hopTimersWrapper = e.find('.hopTimes');
			self.startDate = e.find('.startDate');

			self.startButton = e.find('button.start').on('click', function () {
				if(self.started){
					if(!confirm('Restart the timer, are you really sure?')){
						return;
					}
				}
				self.start();
			});

			e.find('button.stop').on('click', function () {
				if(self.started){
					if(!confirm('Stop the timer, are you really sure?')){
						return;
					}
				}
				self.stop();
			});

			//self.started = brewcalc.storage.timerStarted;
			if(self.started){
				self.started = +self.started;
			}else{
				self.started = '';
			}

			self.boilTime = 60 * 60 * 1000;

			self._poll();

		},

		buildHopTimers: function(hops) {
			var self = this;

			var hopTimers = [];
			self.hopTimersWrapper.empty();

			$.each(hops, function (i, hop) {
				var label = hop.amount + hop.unit + ' ' + hop.name;
				var timer = $('<div class="timer"/>').data('boilTime', +hop.min * 60 * 1000);
				timer.data('label', label);
				self.hopTimersWrapper.append(timer);
			});

		},

		set: function (recipe) {
			var self = this;
			self.recipe = recipe;

			if(self.setTimer){
				clearTimeout(self.setTimer);
			}

			self.started = false;

			/*
			 * delete timer so the app does not slow down when type
			 */
			self.setTimer = setTimeout(function() {
				self.buildHopTimers(self.recipe.hops);
				var notes = (recipe && recipe.notes) || '';
				$.each(notes.split('\n'), function (i, line) {
					if(line.indexOf(self.notePrefix) === 0){
						/*
						 * found boil started note, parse it
						 */
						console.log('parsing boil timer line:', line);

						self.started = moment(line.substring(self.notePrefix.length));
						self.stopped = false;
						self._start();

						return false;
					}
				});
			}, 100);


			if(!self.started){
				self.update();
			}
			
		},

		start: function () {
			var self = this;

			if(self.started){
				return;
			}

			self.stopped = false;

			self.started = new Date().getTime();
			//brewcalc.storage.timerStarted = self.started;

			if(self.recipe){
				var note = self.notePrefix + moment().format('L LT');
				$(document).trigger('bmlappendnote', [note]);
			}

			self._start();
		},

		_start: function () {
			var self = this;

			if(self.recipe){
				self.buildHopTimers(self.recipe.hops);
				
			}

			self._poll();
		},

		stop: function () {
			var self = this;
			self.started = '';
			//brewcalc.storage.timerStarted = self.started;
		},

		update: function () {
			var self = this;

			if(!self.started){
				self.startButton.show();
				self.startDate.text('');
				self.countDownDisplay.text('00:00:00');
				return;
			}

			self.startButton.hide();

			self.startDate.text(moment(self.started).format('LT'));

			//self.timerDisplay

			var startTime = self.started;
			var endTime = self.started + self.boilTime;

			var countDownValue = self._countdownCompute(endTime - new Date().getTime());
			var boildone = false;
			if(countDownValue.match('-.*')){
				countDownValue = 'BOIL DONE';
				boildone = true;
			}

			self.timerDisplay.text(self._countdownCompute(new Date().getTime() - startTime));
			self.countDownDisplay.text(countDownValue);

			self.timerDisplay.show();
			if(boildone){
				self.timerDisplay.parent().hide();
				self.stopped = true;
				return;
			}

			self.timerDisplay.parent().show();

			self.hopTimersWrapper.children().each(function () {
				var hopTimer = $(this);
				
				//var time = startTime + hopTimer.data('boilTime'); 

				var hopstart = self.boilTime - hopTimer.data('boilTime') + startTime;

				var countdown = self._countdownCompute(hopstart - new Date().getTime());

				var label = hopTimer.data('label');

				label = '<span class="hop-addition-time">' + moment(hopstart).format('LT') + '</span> ' + label;

				if(countdown.match('-.*')){
					label += ' ADD TO BOIL';
				}else{
					label += ' (' + countdown + ')';
				}

				hopTimer.html(label);
				
			});
		},

		_poll: function () {
			var self = this;
			if(!self.started){
				return;
			}

			if(self.stopped){
				return;
			}

			self.update();
			setTimeout(function() {
				self._poll();
			}, self.options.interval);
		},

		_pad: function (i) {
			i = i + '';
			if(i.length === 1){
				return '0' + i;
			}
			return i;
		},




		_countdownCompute: function (millis) {
			var self = this;
			var sec, neg, minutes, hours, pad, out, seconds;
			sec = millis/1000;
			neg = '';
			if(sec < 0){
				neg = '- ';
			}
			sec = Math.abs(sec);
			seconds = Math.floor(sec%60);
			minutes = Math.floor((sec/60)%60);
			hours = Math.floor(sec/(60*60));
			pad = self._pad;
			out = neg + hours + ':' + pad(minutes) + ':' + pad(seconds);
			
			return out;
		}
	});
});

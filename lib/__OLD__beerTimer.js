/*
 * jsBrewCalc
 */
/*global console:true, styleTable:true, jQuery:true, BREWCALC:true, moment:true, BEERCODER:true */



(function($, b) {
	'use strict';

	$.widget("bml.beerTimer", {
		options: {
			interval: 1000
		},
	
		_create: function () {
			var self = this,
				o = self.options,
				e = self.element;
			
			e.html(BEERCODER.tmpl('tmplBeerTimer'));

			
			self.timerDisplay = e.find('.timer');
			self.countDownDisplay = e.find('.countDown');
			self.hopTimersWrapper = e.find('.hopTimes');
			self.startDate = e.find('.startDate');

			e.find('button.start').on('click', function () {
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


			self.started = BEERCODER.storage.timerStarted;
			if(self.started){
				self.started = +self.started;
			}else{
				self.started = '';
			}

			//console.log('Recipe', window.beerRecipe);

			

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
			self.buildHopTimers(self.recipe.hops);
		},

		start: function () {
			var self = this;

			if(self.started){
				return;
			}



			self.stopped = false;

			self.started = new Date().getTime();
			BEERCODER.storage.timerStarted = self.started;

			if(self.recipe){
				self.buildHopTimers(self.recipe.hops);
			}

			self._poll();

		},

		stop: function () {
			var self = this;
			self.started = '';
			BEERCODER.storage.timerStarted = self.started;
		},

		update: function () {
			var self = this;

			if(!self.started){
				return;
			}

			self.startDate.text(moment(self.started).format('LT'));

			//self.timerDisplay

			var startTime = self.started;
			var endTime = self.started + self.boilTime;

			self.timerDisplay.text(self._countdownCompute(new Date().getTime() - startTime));
			self.countDownDisplay.text(self._countdownCompute(endTime - new Date().getTime()));

			self.hopTimersWrapper.children().each(function () {
				var hopTimer = $(this);
				
				//var time = startTime + hopTimer.data('boilTime'); 

				var hopstart = self.boilTime - hopTimer.data('boilTime') + startTime;

				var countdown = self._countdownCompute(hopstart - new Date().getTime());

				var label = hopTimer.data('label');

				if(countdown.match('-.*')){
					label += ' ADD TO BOIL';
				}else{
					label += ' ' + countdown;
				}

				label += ' (' + moment(hopstart).format('LT') + ')';


				hopTimer.text(label);
				
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

}(jQuery, BREWCALC));
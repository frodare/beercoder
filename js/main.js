/* globals BEERCODER */
(function () {
	'use strict';

	//$('#tmplRecipeCard').clone().attr('id')

	var defaultRecipe = '--INFO------------------------------\n';
	defaultRecipe += 'style: 10A 2008 American Pale Ale\n';
	defaultRecipe += 'brewers: \n';
	defaultRecipe += 'size: 5 gallons\n';
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

	var timer = $('#timer').beerTimer();

	$('#beercoder').recipeCard({
		bml: BEERCODER.storage.bml || defaultRecipe,
		change: function (ev, o) {
			BEERCODER.storage.bml = o.bml;
			timer.beerTimer('set', o.recipe);
		}
	});

}());
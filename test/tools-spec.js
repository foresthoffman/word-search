/* jshint expr: true */
var expects = require( 'chai' ).expect;
var WORD_SEARCH = require('../scripts/word_search.js');

describe( 'waffles', function() {
	it( 'should be able to access scripts/word_search.js:WORD_SEARCH()',
		function() {
			expects( WORD_SEARCH ).to.ok;
		}
	);
});
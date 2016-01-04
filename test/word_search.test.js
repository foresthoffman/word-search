/* jshint expr: true */

// the assertion library!
var expect = require( 'chai' ).expect;

// for mocking functions!
var sinon = require( 'sinon' );

// for jQuery DOM manipulation!
var jQuery = require( '../scripts/lib/jquery-1.11.3.min.js' );

// the library to test!
var word_search = require( '../scripts/word_search.js' );

describe( 'Dependency Tests: ', function() {
	it( 'chai library exists?', function() {
		expect( expect ).to.be.ok;
	});

	it( 'jQuery library exists?', function() {
		expect( jQuery ).to.be.ok;
	});

	it( 'sinon library exists?', function() {
		expect( sinon ).to.be.ok;
	});

	it( 'word_search library exists?', function() {
		expect( word_search ).to.be.ok;
	});

	it( 'is the WordSearch() class ready to use?', function() {
		var WordSearchClass = new word_search.WordSearch();
		expect( WordSearchClass ).to.be.ok;
	});
});

describe( 'DOM Tests: ', function() {
	it( 'window object is ready to go?', function() {
		expect( window ).to.be.ok;
	});

	it( '#main_content div exists?', function() {
		expect( jQuery( '#main_content' ).length ).to.be.equal( 1 );
	});

	it( '#main_content #word_list_container exists?', function() {
		expect( 
			jQuery( '#main_content #word_list_container' ).length
		).to.be.equal( 1 );
	});

	it( '#main_content #word_table_container exists?', function() {
		expect(
			jQuery( '#main_content #word_table_container' ).length
		).to.be.equal( 1 );
	});
});

describe( 'WordSearch Class Tests: ', function() {

	it( 'WordSearch default file path should be consistent with constructor arguments', function() {
		var WordSearchClass = new word_search.WordSearch( './data/word-search.txt' );

		expect( WordSearchClass._DEFAULT_FILE_PATH ).to.be.equal( './data/word-search.txt' );
	});

	it( "WordSearch.loaded() should get file data and call WordSearch.reset_display()", function() {
		var WordSearchClass = new word_search.WordSearch( './data/word-search.txt' );
		var file_data = 
			"O B M K A T A M A R I O C C S F T P H S\n" +
			"S M G S W G B O J K O N U U R I I A J D\n" +
			"T K H V O O N V X H O D L Z B E L S D O\n" +
			"E D I E P O N A Z R E U D L N X E D B C\n" +
			"V V Y E S M T I M N C I V E L A B P C B\n" +
			"E O C X S B K A S O W B S O R E T S E W\n" +
			"S U M I N A N X C T F R I E K P H B K R\n" +
			"M S B S T D X S T G K B A R N V U A M I\n" +
			"O V G U Y I G K H N B O O P D B V L D R\n" +
			"M U P N E K T U P I H K P Y T M E S G M\n" +
			"H M Z O G J T A F F N R Q L R U A R U A\n" +
			"G L A R O F B R N F C R Z K S K R N G R\n" +
			"L G W T J W I U C U A L A Y R N M E A K\n" +
			"U Q J A B T A M B L X V A T L Y X V S H\n" +
			"R O L P H R R L Y B K J E P T F X L J A\n" +
			"E M M Y J O O Z K N F R V N T A E O E M\n" +
			"A P Q I D E Z L N E V C A H G R R R L S\n" +
			"V M Z R T G Z M I B R N U T A E A D I R\n" +
			"E E O N Z I C G L A K S L E S K R P I F\n" +
			"R M F A T P Z C B I Z D T A J O F S W S\n" +
			"\n" +
			"\n" +
			"Words to find:\n" +
			"\n" +
			"BLINKY\n" +
			"SHINRA\n" +
			"RAPTURE \n" +
			"ANIMUS\n" +
			"FIREFLY \n" +
			"WALKERS\n" +
			"TARDIS \n" +
			"EPONA \n" +
			"CREEPER\n" +
			"AVENGER\n" +
			"PATRONUS \n" +
			"WESTEROS\n" +
			"IFRIT\n" +
			"ARKHAM\n" +
			"VAULT\n" +
			"CLAPTRAP \n" +
			"NORMANDY\n" +
			"REAVER\n" +
			"HEISENBERG\n" +
			"STARK \n" +
			"MORDOR\n" +
			"BIRDMAN \n" +
			"TITAN\n" +
			"OCULUS\n" +
			"GOOMBA\n" +
			"KATAMARI";

		var loaded_spy = sinon.spy( WordSearchClass, 'loaded' );
		var reset_display_spy = sinon.spy( WordSearchClass, 'reset_display' );

		WordSearchClass.loaded( WordSearchClass );

		expect( loaded_spy.calledWith( WordSearchClass ) ).to.be.true;
		expect( loaded_spy.callCount ).to.be.equal( 1 );
		expect( reset_display_spy.callCount ).to.be.equal( 0 );
		expect(
			reset_display_spy.calledWith(
				file_data,
				'file',
				WordSearchClass
			)
		).to.be.true;
	});

	// jump_to_id() function
	it( "WordSearch.jump_to_id() should properly set the window's hash value", function() {
		var WordSearchClass = new word_search.WordSearch();
		var default_href = window.location.href;

		// the window has to have a base location for the WordSearch.jump_to_id()
		// function to work properly
		window.location.href = 'http://localhost:1111';

		expect( window.location.hash ).to.be.equal( '' );

		WordSearchClass.jump_to_id( '#middle' );

		expect( window.location.hash ).to.be.equal('#middle');

		// set the base location back to normal, just to be safe
		window.location.href = default_href;
	});
});
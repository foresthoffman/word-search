/* jshint expr: true */

// the assertion library!
var expect = require( 'chai' ).expect;

// for mocking functions!
var sinon = require( 'sinon' );

// for reading files!
var fs = require( 'fs' );

// for jQuery DOM manipulation!
var jQuery = require( '../scripts/lib/jquery-1.11.3.min.js' );

// the library to test!
var word_search = require( '../scripts/word_search.js' );

describe( 'Dependency Tests', function() {
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

describe( 'DOM Tests', function() {
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

describe( 'WordSearch Class', function() {
	describe( '_DEFAULT_FILE_PATH', function() {
		it( 'should be consistent with path passed to init()', function() {
			var WordSearchClass = new word_search.WordSearch();
			WordSearchClass.init( './data/word-search.txt' );

			expect( WordSearchClass._DEFAULT_FILE_PATH ).to.be.equal( './data/word-search.txt' );
		});
	});

	describe( 'jump_to_id( id )', function() {
		it( "should properly set the window's hash value to the passed hash", function() {
			var WordSearchClass = new word_search.WordSearch();
			var default_href = window.location.href;

			WordSearchClass.init();

			// the window has to have a base location for the jump_to_id()
			// function to work properly
			window.location.href = 'http://localhost:1111';

			expect( window.location.hash ).to.be.equal( '' );

			WordSearchClass.jump_to_id( '#middle' );

			expect( window.location.hash ).to.be.equal( '#middle' );

			// set the base location back to normal, just to be safe
			window.location.href = default_href;
		});
	});

	describe( 'loaded( self )', function() {
		it( 'should be passed a reference to the WordSearch() class', function() {
			var WordSearchClass = new word_search.WordSearch();
			var loaded_spy = sinon.spy( WordSearchClass, "loaded" );
			WordSearchClass.init();

			expect( loaded_spy.calledOnce ).to.be.true;
			expect( loaded_spy.calledWith( WordSearchClass ) ).to.be.true;

			loaded_spy.reset();
		});
	});

	describe( 'get_file_data( url, self, callback )', function() {
		it( 'should be passed a url, a reference to the WordSearch() class, ' + 
				'and a callback', 
			function() {
				var WordSearchClass = new word_search.WordSearch();
				var get_file_data_spy = sinon.spy( WordSearchClass, "get_file_data" );
				WordSearchClass.init( 'data/word-search.fake.txt' );

				expect( get_file_data_spy.calledOnce ).to.be.true;
				expect(
					get_file_data_spy.calledWithExactly(
						'data/word-search.fake.txt',
						WordSearchClass,
						WordSearchClass.reset_display
					)
				).to.be.true;

				get_file_data_spy.reset();
			}
		);
	});

	describe( 'reset_display( data, data_type, self )', function() {
		this.timeout( 4000 );

		var get_file_data_stub;
		var reset_display_stub;
		var WordSearchClass = new word_search.WordSearch();
		var test_data = fs.readFileSync(
			"test/data/word-search.txt",
			"utf-8"
		);

		beforeEach( function() {
			get_file_data_stub = sinon.stub( WordSearchClass, 'get_file_data' ).yields(
				test_data,
				'file',
				WordSearchClass
			);
			reset_display_stub = sinon.stub(
				WordSearchClass,
				'reset_display',
				function ( data, data_type, self ) {}
			);
		});

		afterEach( function() {
			get_file_data_stub.restore();
			reset_display_stub.restore();
		});

		it( 'should be called only once',
			function( done ) {
				
				WordSearchClass.init();

				expect( reset_display_stub.calledOnce ).to.be.true;

				done();
			}
		);

		it( 'should be passed the file data, the data type ("file"), ' +
				'and a reference to the WordSearch() class',
			function( done ) {
				
				WordSearchClass.init();

				expect(
					reset_display_stub.calledWithExactly(
						test_data,
						'file',
						WordSearchClass
					)
				).to.be.true;

				done();
			}
		);
	});

	describe( 'passing get_words() good data', function() {
		this.timeout( 4000 );

		var get_file_data_stub;
		var reset_display_stub;
		var get_words_spy;
		var WordSearchClass = new word_search.WordSearch();
		var test_data_normal = fs.readFileSync(
			"test/data/word-search.txt",
			"utf-8"
		);

		beforeEach( function() {
			get_file_data_stub = sinon.stub( WordSearchClass, 'get_file_data' ).yields(
				test_data_normal,
				'file',
				WordSearchClass
			);
			reset_display_stub = sinon.stub(
				WordSearchClass,
				'reset_display',
				function ( data, data_type, self ) {
					WordSearchClass.get_words( data, data_type, self );
				}
			);
			get_words_spy = sinon.spy( WordSearchClass, 'get_words' );
		});

		afterEach( function() {
			get_file_data_stub.restore();
			reset_display_stub.restore();
			get_words_spy.reset();
		});

		it( 'should return true', function( done ) {
			WordSearchClass.init();

			expect( get_words_spy.returned( true ) ).to.be.true;

			done();
		});
	});
});
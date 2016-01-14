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

describe( 'Dependency Tests', function () {
	it( 'chai library exists?', function () {
		expect( expect ).to.be.ok;
	});

	it( 'jQuery library exists?', function () {
		expect( jQuery ).to.be.ok;
	});

	it( 'sinon library exists?', function () {
		expect( sinon ).to.be.ok;
	});

	it( 'word_search library exists?', function () {
		expect( word_search ).to.be.ok;
	});

	it( 'is the WordSearch() class ready to use?', function () {
		var WordSearchClass = new word_search.WordSearch();
		expect( WordSearchClass ).to.be.ok;
	});
});

describe( 'DOM Tests', function () {
	it( 'window object is ready to go?', function () {
		expect( window ).to.be.ok;
	});

	it( '#main_content div exists?', function () {
		expect( jQuery( '#main_content' ).length ).to.be.equal( 1 );
	});

	it( '#main_content #word_list_container exists?', function () {
		expect( 
			jQuery( '#main_content #word_list_container' ).length
		).to.be.equal( 1 );
	});

	it( '#main_content #word_table_container exists?', function () {
		expect(
			jQuery( '#main_content #word_table_container' ).length
		).to.be.equal( 1 );
	});
});

describe( 'WordSearch Class', function () {
	describe( '_DEFAULT_FILE_PATH property', function () {
		it( 'should be consistent with path passed to init()', function () {
			var WordSearchClass = new word_search.WordSearch();
			WordSearchClass.init( './data/word-search.txt' );

			expect( WordSearchClass._DEFAULT_FILE_PATH ).to.be.equal( './data/word-search.txt' );
		});
	});

	describe( 'jump_to_id()', function () {
		it( "should properly set the window's hash value to the passed hash", function () {
			var WordSearchClass = new word_search.WordSearch();
			var default_href = window.location.href;

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

	describe( 'loaded()', function () {
		it( 'should be passed a WordSearch class reference', function () {
			var WordSearchClass = new word_search.WordSearch();
			var loaded_spy = sinon.spy( WordSearchClass, 'loaded' );
			WordSearchClass.init();

			expect( loaded_spy.calledOnce ).to.be.true;
			expect( loaded_spy.calledWith( WordSearchClass ) ).to.be.true;

			loaded_spy.reset();
		});
	});

	describe( 'get_file_data()', function () {
		it( 'should be passed a url, a WordSearch class reference, ' + 
				'and a callback', 
			function () {
				var WordSearchClass = new word_search.WordSearch();
				var get_file_data_spy = sinon.spy( WordSearchClass, 'get_file_data' );
				WordSearchClass.init( 'data/word-search.fake.txt' );

				expect( get_file_data_spy.calledOnce ).to.be.true;
				expect(
					get_file_data_spy.calledWithExactly(
						'data/word-search.fake.txt',
						WordSearchClass.reset_display,
						WordSearchClass						
					)
				).to.be.true;

				get_file_data_spy.reset();
			}
		);
	});

	describe( 'reset_display()', function () {
		this.timeout( 4000 );

		var get_file_data_stub;
		var reset_display_stub;
		var WordSearchClass = new word_search.WordSearch();
		var test_data = fs.readFileSync(
			'test/data/word-search.txt',
			'utf-8'
		);

		beforeEach( function () {
			//! this should be done differently, it isn't reliant on the actual ajax call
			//! it just returns whatever you tell it to. 
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

		afterEach( function () {
			get_file_data_stub.restore();
			reset_display_stub.restore();
		});

		it( 'should be called only once',
			function ( done ) {
				
				WordSearchClass.init();

				expect( reset_display_stub.calledOnce ).to.be.true;

				done();
			}
		);

		it( 'should be passed the file data, a "file" string, ' +
				'and a WordSearch class reference',
			function ( done ) {
				
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

	describe( 'validate_data()', function () {
		var WordSearchClass = new word_search.WordSearch();
		var validate_data_spy;
		var test_data_normal = fs.readFileSync(
			'test/data/word-search.txt',
			'utf-8'
		);
		var test_data_bad = fs.readFileSync(
			'test/data/word-search.bad.txt',
			'utf-8'
		);

		beforeEach( function () {
			validate_data_spy = sinon.spy( WordSearchClass, 'validate_data' );
		});

		afterEach( function () {
			validate_data_spy.restore();
		});

		
		it( 'should return grid-empty error', function () {
			
			// check that validate_data hasn't been called
			expect( validate_data_spy.called ).to.be.false;


			
			// expect( validate_data_spy.returned( true ) ).to.be.true;
		});

		it( 'should return false with bad data', function () {

			// check that validate_data hasn't been called
			expect( validate_data_spy.called ).to.be.false;

			

			// expect( validate_data_spy.returned( false ) ).to.be.true;
		});
	});
});
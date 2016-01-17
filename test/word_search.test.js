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

describe( 'WordSearch Class.', function () {
	describe( '_DEFAULT_FILE_PATH', function () {
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
				WordSearchClass.init();

				expect( get_file_data_spy.calledOnce ).to.be.true;
				expect(
					get_file_data_spy.calledWithExactly(
						'data/word-search.txt',
						WordSearchClass.reset_display,
						WordSearchClass
					)
				).to.be.true;

				get_file_data_spy.reset();
			}
		);
	});

	describe( 'reset_display()', function () {
		var ajax_stub;
		var reset_display_stub;
		var WordSearchClass = new word_search.WordSearch();
		var file_data = fs.readFileSync(
			'test/data/word-search.err-no-errors.txt',
			'utf-8'
		);

		beforeEach( function () {
			ajax_stub = sinon.stub( jQuery, 'ajax' );

			// simulate the GET request in get_file_data() and return the expected data
			ajax_stub.withArgs(
					{
						url: 'data/word-search.txt',
						success: sinon.match.func
					}
				).yieldsTo(
				'success',
				file_data,
				'file',
				WordSearchClass
			);

			// make reset_display an anonymous function to stop the progression of the word search
			reset_display_stub = sinon.stub(
				WordSearchClass,
				'reset_display',
				function ( raw_data, origin, self ) {}
			);
		});

		afterEach( function () {
			ajax_stub.restore();
			reset_display_stub.restore();
		});

		it( 'should be called only once', function () {
			WordSearchClass.init();

			expect( reset_display_stub.calledOnce ).to.be.true;
		});

		it( 'should be passed the file data, a "file" string, and a WordSearch class reference',
			function () {
				WordSearchClass.init();

				expect( reset_display_stub.args[0].length ).to.be.equal( 3 );
				expect( reset_display_stub.args[0][0] ).to.be.equal( file_data );
				expect( reset_display_stub.args[0][1] ).to.be.equal( 'file' );
				expect( reset_display_stub.args[0][2] ).to.be.equal( WordSearchClass );
			}
		);
	});

	describe( 'validate_data()', function () {

		// stubs and spies
		var validate_data_spy;
		var reset_display_stub;
		var get_file_data_stub;
		var ajax_stub;

		// class instance
		var WordSearchClass = new word_search.WordSearch();
		
		// for reading test case files
		var init_path = '';
		var file_data;

		// for iterating through the tests
		var current_test;
		var assert_counter = 0;
		var assertion_data = [
			{
				'err': 'file-invalid',
				'origin': 'file'
			},
			{
				'err': 'grid-empty',
				'origin': 'form'
			},
			{
				'err': 'list-empty',
				'origin': 'form'
			},
			{
				'err': 'grid-empty-list-empty',
				'origin': 'form'
			},
			{
				'err': 'grid-alpha',
				'origin': 'form'
			},
			{
				'err': 'list-alpha',
				'origin': 'form'
			},
			{
				'err': 'grid-alpha-list-alpha',
				'origin': 'form'
			},
			{
				'err': 'grid-row-length',
				'origin': 'form'
			},
			{
				'err': 'no-errors',
				'origin': 'file'
			},
			{
				'err': 'no-errors',
				'origin': 'form'
			}
		];

		before( function () {
			validate_data_spy = sinon.spy( WordSearchClass, 'validate_data' );
		});

		beforeEach( function () {
			current_test = assertion_data[ assert_counter ];
			
			init_path = 'data/word-search.err-' + current_test.err + '.txt';
			file_data = fs.readFileSync(
				'test/' + init_path,
				'utf-8'
			);

			// 'no-errors' tests will pass with no errors, and we don't want the rest of
			// the program to run. That's why we'll stub out just the validation calls.
			if ( 'no-errors' === current_test.err ) {
				reset_display_stub = sinon.stub(
					WordSearchClass,
					'reset_display',
					function ( raw_data, origin, self ) {
						var input_obj = self.map_to_obj( raw_data, origin );
						var errors_array = self.validate_data( input_obj, origin, self );
					}
				);
			}

			if ( 'file' === current_test.origin ) {
				ajax_stub = sinon.stub( jQuery, 'ajax' );

				// simulate a GET request to get specific errors (or lack of)
				ajax_stub.withArgs(
						{
							url: init_path,
							success: sinon.match.func
						}
					).yieldsTo(
					'success',
					file_data,
					'file',
					WordSearchClass
				);

				// initialize class with test-specific path
				WordSearchClass.init( init_path );
			} else if ( 'form' === current_test.origin ) {

				// prevent get_file_data from doing anything, we're running form tests here!
				get_file_data_stub = sinon.stub(
					WordSearchClass,
					'get_file_data',
					function () {
						// do nothing
					}
				);

				// using the files to fill the form inputs
				var input_obj = WordSearchClass.map_to_obj( file_data, 'file' );

				// fill the forms with data
				jQuery( '#word_search_form_textarea_grid' ).val( input_obj.word_grid );
				jQuery( '#word_search_form_textarea_list' ).val( input_obj.word_list );

				// initialize class like normal to setup the click event listener
				WordSearchClass.init();

				jQuery( '#submit' ).trigger( 'click' );
			}
		});

		afterEach( function () {
			validate_data_spy.reset();

			if ( 'no-errors' === current_test.err ) {
				reset_display_stub.restore();
			}

			if ( 'file' === current_test.origin ) {
				ajax_stub.restore();
			} else if ( 'form' === current_test.origin ) {

				// to mitigate the event listeners piling up as a result of repeated class instantiation
				jQuery( '#submit' ).off( 'click', WordSearchClass.get_form_data );
				get_file_data_stub.restore();
			}

			assert_counter++;
		});

		it( 'should return file-invalid error', function () {
			expect(
				validate_data_spy.returned([
					{
						'field_type': 'file',
						'error_type': 'invalid'
					}
				])
			).to.be.true;
		});

		it( 'should return grid-empty error', function () {
			expect(
				validate_data_spy.returned([
					{
						'field_type': 'grid',
						'error_type': 'empty'
					}
				])
			).to.be.true;
		});

		it( 'should return list-empty error', function () {
			expect(
				validate_data_spy.returned([
					{
						'field_type': 'list',
						'error_type': 'empty'
					}
				])
			).to.be.true;
		});

		it( 'should return grid-empty and list-empty errors', function () {
			expect(
				validate_data_spy.returned([
					{
						'field_type': 'grid',
						'error_type': 'empty'
					},
					{
						'field_type': 'list',
						'error_type': 'empty'
					}
				])
			).to.be.true;
		});

		it( 'should return grid-non-alpha error', function () {
			expect(
				validate_data_spy.returned([
					{
						'field_type': 'grid',
						'error_type': 'non-alpha'
					}
				])
			).to.be.true;
		});

		it( 'should return list-non-alpha error', function () {
			expect(
				validate_data_spy.returned([
					{
						'field_type': 'list',
						'error_type': 'non-alpha'
					}
				])
			).to.be.true;
		});

		it( 'should return grid-non-alpha and list-non-alpha errors', function () {
			expect(
				validate_data_spy.returned([
					{
						'field_type': 'grid',
						'error_type': 'non-alpha'
					},
					{
						'field_type': 'list',
						'error_type': 'non-alpha'
					}
				])
			).to.be.true;
		});

		it( 'should return grid-row-length error', function () {
			expect(
				validate_data_spy.returned([
					{
						'field_type': 'grid',
						'error_type': 'row-length'
					}
				])
			).to.be.true;
		});

		it( 'should return no file errors', function () {
			expect( validate_data_spy.returned( [] ) ).to.be.true;
		});

		it( 'should return no form errors', function () {
			expect( validate_data_spy.returned( [] ) ).to.be.true;
		});
	});
});
/**
 * JavaScript Word Search Solver
 * 
 * by: Forest Hoffman (http://forest.stfhs.net/forest)
 *
 * Description: This program takes a word grid and searches through a word 
 * list for the first occurrence of each word. By default a file is used to 
 * read in the word grid and word list, but the custom forms allow for a word
 * grid and word list of any size to be searched. Horizontal matches are
 * indicated by a blue border on the bottom of the word. Vertical matches
 * are indicated by white borders on either side of the word. Diagonal
 * matches are indicated by red text. Detailed match information is sent
 * to the JavaScript console.
 *
 * Copyright (C) 2015 Forest J. Hoffman
 * 	
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 	
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 	
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 */

// mitigating scope issues with jQuery and Mocha
if ( "undefined" === typeof( jQuery ) ) {
	jQuery = require( './lib/jquery-1.11.3.min.js' );
}

// this is necessary for testing (compatibility with NodeJS)
if ( "undefined" !== typeof( module ) ) {
	module.exports.WordSearch = WordSearch;
}

/**
 * Class: WordSearch
 * 
 * Description: Contains all the functions to run a word search.
 *
 */
function WordSearch () {}

/**
 * Function: init
 * 
 * Description: Prepares all of the WordSearch class's properties, and passes
 * 		a reference to WordSearch the class to the loaded function.
 *
 * Input(s):
 * - default_file_path (string), contains a path to a data file.
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.init = function ( default_file_path ) {
	
	// an object full of arrays of characters that represent rows broken apart
	this.WORD_GRID = {};
	
	// an array full of strings that are the rows' characters pieced together
	this.WORD_GRID_ROWS = [];
	
	// an array of words to search for
	this.WORDS_TO_MATCH = [];
	this.WORDS_TO_MATCH_TRIMMED = [];
	
	// global constants including lengths and counts
	this._LENGTH_OF_LONGEST_WORD = 0;
	this._LENGTH_OF_SHORTEST_WORD = 0;
	this._MAX_DIAGONAL_LENGTH = 0;
	this._GRID_ROW_COUNT = 0;
	this._GRID_ROW_LENGTH = 0;
	this._DEFAULT_FILE_PATH = (
		'undefined' !== typeof( default_file_path ) ?
		default_file_path :
		'data/word-search.txt'
	);
	var self = this;
	this.loaded( self );
};

/**
 * Function: loaded
 * 
 * Description: Calls get_file_data and creates a form submission event listener.
 *
 * Input(s):
 * - self (object), contains a reference to the current instance of the
 *		WordSearch class.
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.loaded = function ( self ) {
	self.get_file_data( self._DEFAULT_FILE_PATH, self.reset_display, self );

	/**
	 * Form submission click event
	 *
	 * The listener prevents normal form submission. It then confirms that the form
	 * has been filled out correctly and determines whether to refresh the display or
	 * throw an error.
	 *
	 */
	jQuery( '#submit' ).on( 'click', { 'self': self }, self.get_form_data );
};

/**
 * Function: get_file_data
 * 
 * Description: Sends a GET request for a data file at a specified path, and sends
 * 		the data to a specified function.
 *
 * Input(s):
 * - url (string), contains a path to the data file to read.
 * - callback (function), contains a function to pass the file data to.
 * - self (object), contains a reference to the current instance of the
 *		WordSearch class.
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.get_file_data = function ( url, callback, self ) {
	jQuery.ajax({
		url: url,
		success: function ( data ) {
			callback( data, 'file', self );
		}
	});
};

/**
 * Function: get_form_data
 * 
 * Description: Handles simple input validation before sending form data
 * 		off to be parsed (and checked more strictly). Clears up old
 *		errors before each run, and displays any new errors on screen.
 *
 * Input(s):
 * - e (object), contains the form click event.
 * - self (object), contains a reference to the current instance of the
 *		WordSearch class.
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.get_form_data = function ( e ) {
	e.preventDefault();

	var self = e.data.self;
	
	// remove the current errors on screen, and reset the 1 global to 0
	var word_grid_val = jQuery( '#word_search_form_textarea_grid' ).val();
	var word_list_val = jQuery( '#word_search_form_textarea_list' ).val();

	var new_data = [
		word_grid_val,
		word_list_val
	];

	self.reset_display( new_data, 'form', self );
};

WordSearch.prototype.map_to_obj = function ( data, origin ) {
	var obj = {};
	if ( 'file' === origin ) {
		var split_data = data.split( "\n\n===<BREAK>===\n\n" );
		obj = {
			'word_grid': split_data[0],
			'word_list': split_data[1]
		};
	} else if ( 'form' === origin ) {
		obj = {
			'word_grid': data[0],
			'word_list': data[1]
		};
	}
	return obj;
};

/**
 * Function: reset_display
 * 
 * Description: Intakes data from a file or the custom form then it passes 
 * 		that information to the prepare_search function. When the prepare_search function succeeds
 *		the grid and word lists are recreated and the search functions are called.
 *
 * Input(s):
 * - data (string/array), contains the grid and word list that will be processed by
 * 		the prepare_search function.
 * - origin (string), contains the values "file" or "form" to pass to the prepare_search
 *		function to determine how to handle the string/array in the data parameter.
 * - self (object), contains a reference to the current instance of the
 *		WordSearch class. 
 *
 * Returns:
 * - FALSE, on failure, when prepare_search returns a false value.
 * - TRUE, on success, when prepare_search successfuly processes the new data.
 *
 */
WordSearch.prototype.reset_display = function ( raw_data, origin, self ) {
	var input_obj = self.map_to_obj( raw_data, origin );

	self.clear_alerts();
	var errors_array = self.validate_data( input_obj, origin, self );

	if ( 0 !== errors_array.length ) {
		self.error_handler( errors_array, self );
	} else {
		var trimmed_data_obj = self.trim_inputs( input_obj );
		self.prepare_search( trimmed_data_obj, self );
		self.create_display();
		self.search_for_words();
		self.jump_to_id( 'top' );
	}
};

/**
 * Function: prepare_search
 * 
 * Description: Receives data from the reset_display function and
 *		parses the data differently depending on the type of data that it is handling.
 *		It validates the data before settings all of the global variables and constants. 
 *		The word grid and word lists are stored in separate variables which make displaying
 *		and processing the data easier. Both are trimmed and sorted before they are displayed. 
 *		Look at the validate_input function for more information on how the input data is parsed.
 *
 * Input(s):
 * - data (string/array), contains the grid and word list to be processed. If in array
 *		form, data[0] is expected to hold the grid and data[1] the word list.
 * - self (object), contains a reference to the current instance of the
 *		WordSearch class.
 *
 * Returns: 
 * - FALSE, on failure, when the data can't be processed.
 * - TRUE, on success.
 *
 */
WordSearch.prototype.prepare_search = function ( input_obj, self ) {	
	var word_grid = input_obj.word_grid;
	var word_list = input_obj.word_list;
	
	var word_grid_rows = word_grid.split( '\n' );
	
	// reset WORD_GRID
	self.WORD_GRID = {};
	self.WORD_GRID_ROWS = [];

	for ( var i = 0; i < word_grid_rows.length; i++ ) {
		var word_grid_chars = word_grid_rows[ i ].split( ' ' );
		for ( var x = 0; x < word_grid_chars.length; x++ ) {
			self.WORD_GRID[ i ] = word_grid_chars;
			self.WORD_GRID_ROWS[ i ] = word_grid_chars.join( ' ' ).replace( /[^\S\n]+/g, '' );
		}
	}

	// reset WORDS_TO_MATCH & WORDS_TO_MATCH_TRIMMED
	self.WORDS_TO_MATCH = [];
	self.WORDS_TO_MATCH_TRIMMED = [];
	
	var words_to_match_array = word_list.split( "\n" );
	jQuery.each( words_to_match_array, function ( i, word ) {
		self.WORDS_TO_MATCH.push( word );
		self.WORDS_TO_MATCH_TRIMMED.push( word.replace( /[^\S\n]+/g, '' ) );
	});
	var sorted_words = self.WORDS_TO_MATCH;
	sorted_words.sort( function ( a, b ) {
		
		/*
		 * returns > 0 -> b's index gets bumped below a's
		 * returns < 0 -> a's index gets bumbed below b's
		 * returns 0   -> indices are the same
		 */
		return b.length - a.length;
	});
	var sorted_words_trimmed = self.WORDS_TO_MATCH_TRIMMED;
	sorted_words_trimmed.sort( function ( a, b ) {
		return b.length - a.length;
	});
	self._LENGTH_OF_LONGEST_WORD = sorted_words_trimmed[0].length;
	self._LENGTH_OF_SHORTEST_WORD = sorted_words_trimmed[ sorted_words_trimmed.length - 1 ].length;
	self._GRID_ROW_COUNT = Object.keys( self.WORD_GRID ).length;
	self._GRID_ROW_LENGTH = self.WORD_GRID[0].length;
	self._MAX_DIAGONAL_LENGTH = Math.min( self._GRID_ROW_COUNT, self._GRID_ROW_LENGTH );
};

WordSearch.prototype.trim_inputs = function ( input_obj ) {
	if ( 'undefined' === typeof( input_obj ) ) {
		return;
	}

	var word_grid = input_obj.word_grid;
	var word_list = input_obj.word_list;

	/*
	 * Remove extraneous spaces at the beginning and end of the input,
	 * then remove the spaces before and after newlines,
	 * then add spaces between any adjacent letters,
	 * finally make the string uppercase.
	 */
	var trimmed_word_grid = word_grid.trim().replace(
		/\s+(?=\n)/g,
		''
	).replace(
		/\n[^\S\n]+(?=[a-zA-Z])/g,
		'\n'
	).replace(
		/[^\S\n]+(?=[a-zA-Z])/g,
		' '
	).replace(
		/([a-zA-Z]){2,}/g,
		function ( match ) {
			return match.split( '' ).join( ' ' );
		}
	).toUpperCase();

	// remove spaces from the element and remove any extra newline characters
	var trimmed_word_list = word_list.trim().replace(
		/(\n){2,}/g,
		'\n'
	).replace(
		/\s+(?=\n)/g,
		''
	).replace(
		/\n[^\S\n]+(?=[a-zA-Z])/g,
		'\n'
	).replace(
		/[^\S\n]+(?=[a-zA-Z])/g,
		' '
	).toUpperCase();

	return {
		'word_grid': trimmed_word_grid,
		'word_list': trimmed_word_list
	};
};

WordSearch.prototype.validate_data = function ( input_obj, origin, self ) {
	var error_array = [];

	if ( 'undefined' === typeof( input_obj ) ||
			'undefined' === typeof( input_obj.word_grid ) ||
			'undefined' === typeof( input_obj.word_list ) ||
			'' === input_obj.word_grid ||
			'' === input_obj.word_list ) {
		
		if ( 'file' === origin ) {
			error_array.push(
				{ 
					'field_type': 'file',
					'error_type': 'invalid'
				}
			);
			return error_array;
		} else if ( 'form' === origin ) {
			if ( 'undefined' === typeof( input_obj.word_grid ) ||
					'' === input_obj.word_grid ) {
				error_array.push(
					{ 
						'field_type': 'grid',
						'error_type': 'empty'
					}
				);
			}

			if ( 'undefined' === typeof( input_obj.word_list ) ||
					'' === input_obj.word_list ) {
				error_array.push(
					{ 
						'field_type': 'list',
						'error_type': 'empty'
					}
				);
			}
		}
	}

	var trimmed_data_obj = self.trim_inputs( input_obj );
	var word_grid = trimmed_data_obj.word_grid;
	var word_list = trimmed_data_obj.word_list;
	var row_array = word_grid.split( "\n" );

	if ( word_grid.match( /[^a-zA-Z\s]/ ) ) {
		error_array.push(
			{
				'field_type': 'grid',
				'error_type': 'non-alpha'
			}
		);
	}

	if ( word_list.match( /[^a-zA-Z\s]/ ) ) {
		error_array.push(
			{
				'field_type': 'list',
				'error_type': 'non-alpha'
			}
		);
	}

	for ( var i = 0; i < row_array.length; i++ ) {
		if ( row_array[ i ].length !== row_array[0].length ) {
			error_array.push(
				{
					'field_type': 'grid',
					'error_type': 'row-length'
				}
			);
			break;
		}
	}
	return error_array;
};

WordSearch.prototype.error_handler = function ( error_array ) {
	if ( 0 !== error_array.length ) {
		for ( var i = 0; i < error_array.length; i++ ) {
			var error_obj = error_array[ i ];
			var error_msg = '';
			switch ( error_obj.field_type ) {
				case 'grid':
					if ( 'row-length' === error_obj.error_type ) {
						error_msg = 'There is an issue with the grid field! Make sure ' +
							'that the grid rows are all the same length.';
						jQuery( '#word_search_form label[for="word_grid"]' ).css(
							'color',
							'#DB2406'
						);
					} else if ( 'empty' === error_obj.error_type ) {
						error_msg = 'The grid field must be filled.';
						jQuery( '#word_search_form label[for="word_grid"]' ).css(
							'color',
							'#DB2406'
						);
					} else if ( 'non-alpha' === error_obj.error_type ) {
						error_msg = 'The grid field may only contain '+
							'alphabetical characters and spaces.';
						jQuery( '#word_search_form label[for="word_grid"]' ).css(
							'color',
							'#DB2406'
						);
					}
					break;
				case 'list':
					if ( 'empty' === error_obj.error_type ) {
						error_msg = 'The list field must be filled.';
						jQuery( '#word_search_form label[for="word_list"]' ).css(
							'color',
							'#DB2406'
						);
					} else if ( 'non-alpha' === error_obj.error_type ) {
						error_msg = 'The list field may only contain '+
							'alphabetical characters and spaces.';
						jQuery( '#word_search_form label[for="word_list"]' ).css(
							'color',
							'#DB2406'
						);
					}
					break;
				case 'file':
					if ( 'invalid' === error_obj.error_type ) {
						error_msg = 'That file does not exist! Please try again.';
						jQuery( '#word_search_form label[for="file_upload"]' ).css(
							'color',
							'#DB2406'
						);
					}
					break;
			}
			jQuery( '#word_search_form #alert-list' ).append( '<li>' + error_msg + '</li>' );
			jQuery( '#word_search_form #alert-area' ).show();
		}
	}
};

/**
 * Function: found_word
 * 
 * Description: Receives data on the zero-indexed row and column location of the word that has been
 *		matched. It also receives the type of the match and the coloring to be applied to
 *		the matched word. The word is then styled depending on the type of the match.
 *
 * Input(s):
 * - row (int), zero-indexed y-axis location of the match.
 * - column (int), zero-indexed x-axis location of the match.
 * - word_length (int), the length of the matched word, used to iterate over the word grid.
 * - match_type (string), indicates the direction of the match: "row" (horizontal), "column" (vertical),
 *		"diagonal-right", or "diagonal-left".
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.found_word = function ( row, column, word_length, match_type, color ) {
	
	// some styling to point out matched words
	for ( var i = 0; i < word_length; i++ ) {
		switch ( match_type ) {
			case 'row':
				jQuery( '#word_table_container td' ).eq( ( column + i ) + this._GRID_ROW_LENGTH * row ).css(
					'border-bottom',
					'solid 1px ' + color
				);
				break;
			case 'column':
				jQuery( '#word_table_container td' ).eq( column + this._GRID_ROW_LENGTH * ( row + i ) ).css(
					{
						'border-left': 'solid 1px ' + color,
						'border-right': 'solid 1px ' + color
					}
				);
				break;
			case 'diagonal-right':
				jQuery( '#word_table_container td' ).eq( ( column + i ) + this._GRID_ROW_LENGTH * ( row + i ) ).css(
					'color',
					color
				);
				break;
			case 'diagonal-left':
				jQuery( '#word_table_container td' ).eq( column + ( this._GRID_ROW_LENGTH * ( row + i ) - i ) ).css(
					'color',
					color
				);
				break;
			default:
				return;
		}
	}
};

/**
 * Function: remove_word_from_list
 * 
 * Description: Removes the word at the received index in the word list global variables and styles the 
 *		displayed word list to reflect that the word has been found.
 *
 * Input(s):
 * - index (int), zero-indexed index of the word to be removed form the word lists.
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.remove_word_from_list = function ( index ) {
	
	// scratch the word out on the list
	jQuery( '#word_list_container li:contains(' + this.WORDS_TO_MATCH[ index ] + ')' ).css( 'color', '#777' );
	
	// if we've already matched the word, we don't need to search for it again.
	this.WORDS_TO_MATCH.splice( index, 1 );
	this.WORDS_TO_MATCH_TRIMMED.splice( index, 1 );
};

/**
 * Function: search_for_words
 * 
 * Description: Handles calling the various search functions and adds some formatting to the JavaScript console.
 *
 * Input(s): N/A
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.search_for_words = function () {
	console.log( '################## Searching...' );
	var initial_word_count = this.WORDS_TO_MATCH_TRIMMED.length;
	
	var start_time = Date.now();
	this.search_row();
	this.search_column();
	this.search_diagonal();
	var elapsed_time = Date.now() - start_time;

	var words_found_count = initial_word_count - this.WORDS_TO_MATCH_TRIMMED.length;
	console.log(
		'################## All done! (' + 
		words_found_count + '/' + initial_word_count +
		' found, ' + elapsed_time + 'ms)'
	);
};

/**
 * Function: search_row
 * 
 * Description: Searches every row in the word grid (using the WORD_GRID_ROWS global, which stores rows as
 *		strings) and compares each row against the word list to find a match. First they are compared
 *		normally, then the word list is reversed and compared again. When a word is found, the match
 *		is logged, highlighted, and removed from the word list. To mitigate the change in the length
 *		of the word list, the for-loop counter is then decremented.
 *
 * Input(s): N/A
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.search_row = function () {
	for ( var i = 0; i < this.WORD_GRID_ROWS.length; i++ ) {
		for ( var x = 0; x < this.WORDS_TO_MATCH_TRIMMED.length; x++ ) {
			
			// search for forwards words in the row
			var index_of_word = this.WORD_GRID_ROWS[ i ].indexOf( this.WORDS_TO_MATCH_TRIMMED[ x ] );
			if ( -1 !== index_of_word ) {
				console.log( 'Horizontal match for "' + this.WORDS_TO_MATCH[ x ] + '" on row ' + ( i + 1 ) + ' starting at letter #' + ( index_of_word + 1 ) );
				this.found_word( i, index_of_word, this.WORDS_TO_MATCH_TRIMMED[ x ].length, 'row', '#54A9CC' );
				this.remove_word_from_list( x );
				x--;
			}
		}
		for ( var y = 0; y < this.WORDS_TO_MATCH_TRIMMED.length; y++ ) {

			// search for backwards words in the row, by flipping the search word
			var word_reversed = this.WORDS_TO_MATCH_TRIMMED[ y ].split( '' ).reverse().join( '' );
			var index_of_word_reversed = this.WORD_GRID_ROWS[ i ].indexOf( word_reversed );
			if ( -1 !== index_of_word_reversed ) {
				console.log( 'Horizontal match (reversed) for "' + this.WORDS_TO_MATCH[ y ] + '" on row ' + ( i + 1 ) + ' ending at letter #' + ( index_of_word_reversed + 1 ) );
				this.found_word( i, index_of_word_reversed, this.WORDS_TO_MATCH_TRIMMED[ y ].length, 'row', '#54A9CC' );
				this.remove_word_from_list( y );
				y--;
			}
		}
	}
};

/**
 * Function: search_column
 * 
 * Description: Searches every column in the word grid by using the first row of the WORD_GRID_ROWS array. 
 *		Every column is combined into a string and then compared against the word list. First they are compared
 *		normally, then the words are reversed and compared again. When a word is found, the match
 *		is logged, highlighted, and removed from the word list. To mitigate the change in the length
 *		of the word list, the for-loop counter is then decremented.
 *
 * Input(s): N/A
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.search_column = function () {

	// iterate over the first row, looking at each column
	for ( var i = 0; i < this.WORD_GRID_ROWS[0].length; i++ ) {

		// piece together each column into a searchable string
		var column_string = '';
		for ( var x = 0; x < Object.keys( this.WORD_GRID ).length; x++ ) {
			column_string += this.WORD_GRID[ x ][ i ];
		}

		// search for words
		for ( var y = 0; y < this.WORDS_TO_MATCH_TRIMMED.length; y++ ) {
			var index_of_word = column_string.indexOf( this.WORDS_TO_MATCH_TRIMMED[ y ] );
			if ( -1 !== index_of_word ) {
				console.log( 'Vertical match for "' + this.WORDS_TO_MATCH[ y ] + '" on row ' + ( index_of_word + 1 ) + ' starting at letter #' + ( i + 1 ) );
				this.found_word( index_of_word, i, this.WORDS_TO_MATCH_TRIMMED[ y ].length, 'column', '#EEEEEE' );
				this.remove_word_from_list( y );
				y--;
			}
		}

		// search for backwards words
		for ( var z = 0; z < this.WORDS_TO_MATCH_TRIMMED.length; z++ ) {
			var word_reversed = this.WORDS_TO_MATCH_TRIMMED[ z ].split( '' ).reverse().join( '' );
			var index_of_word_reversed = column_string.indexOf( word_reversed );
			if ( -1 !== index_of_word_reversed ) {
				console.log( 'Vertical match (reversed) for "' + this.WORDS_TO_MATCH[ z ] + '" on row ' + ( index_of_word_reversed + 1 ) + ' ending at letter #' + ( i + 1 ) );
				this.found_word( index_of_word_reversed, i, this.WORDS_TO_MATCH_TRIMMED[ z ].length, 'column', '#EEEEEE' );
				this.remove_word_from_list( z );
				z--;
			}
		}
	}
};

/**
 * Function: search_diagonal
 * 
 * Description: Loops through every row and column to check for diagonal matches to the left and right of every
 * 		character. Characters in positions on the grid that could not possibly have diagonal matches
 * 		will be ignored. If the dimensions of the grid are not large enough to allow for diagonal matches
 * 		with the provided word list, a notification will be logged and the function will return nothing. 
 * 		The length of the search at each character is determined by the grid dimensions, the character's
 * 		position on the grid, and the length of the longest word. The search length can't be larger than
 * 		the length of the shortest word. If the search length is less than the maximum diagonal length
 * 		on the grid, a string will be generated and compared against the word list. When a word is found,
 * 		the match is logged, highlighted, and removed from the word list. To mitigate the change in the
 * 		length of the word list, the for-loop counter is decremented by one.
 *
 * Input(s): N/A
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.search_diagonal = function () {
	if ( this._MAX_DIAGONAL_LENGTH < this._LENGTH_OF_SHORTEST_WORD ) {
		console.log( 'Not enough space to search diagonally.' );
		return;
	}

	// iterate over each row - traverses up and down
	for ( var i = 0; i < Object.keys( this.WORD_GRID ).length; i++ ) {

		// iterate over each column - traverses left and right
		for ( var x = 0; x < this.WORD_GRID[ i ].length; x++ ) {
			
			// for each character, we check down the the left and right, 
			// and up to the left and right
			var diagonal_right_string = '';
			var diagonal_left_string = '';
			var search_length = 0;
			
			// get the length of the diagonal from the character down to the right
			if ( this._GRID_ROW_LENGTH - x >= this._LENGTH_OF_LONGEST_WORD && this._GRID_ROW_COUNT - i >= this._LENGTH_OF_LONGEST_WORD ) {
				search_length = this._LENGTH_OF_LONGEST_WORD;
			} else if ( this._GRID_ROW_LENGTH - x >= this._LENGTH_OF_SHORTEST_WORD && this._GRID_ROW_COUNT - i >= this._LENGTH_OF_SHORTEST_WORD ) {
				search_length = Math.min( this._GRID_ROW_LENGTH - x, this._GRID_ROW_COUNT - i );
			}
			if ( search_length > 0 ) {

				// the distance to search diagonally from each letter
				for ( var y = 0; y < search_length; y++ ) {
					diagonal_right_string += this.WORD_GRID[ i + y ][ x + y ];
				}

				// check if the word exists in the diagonal down and to the right, forwards
				for ( var z = 0; z < this.WORDS_TO_MATCH_TRIMMED.length; z++ ) {
					var index_of_right_word = diagonal_right_string.indexOf( this.WORDS_TO_MATCH_TRIMMED[ z ] );
					if ( -1 !== index_of_right_word ) {
						console.log( 'Diagonal match (down and right) for "' + this.WORDS_TO_MATCH[ z ] + '" on row ' + ( i + 1 + index_of_right_word ) + ' starting at letter #' + ( x + 1 + index_of_right_word ) );
						this.found_word( i + index_of_right_word, x + index_of_right_word, this.WORDS_TO_MATCH_TRIMMED[ z ].length, 'diagonal-right', '#DB2406' );
						this.remove_word_from_list( z );
						z--;
					}
				}

				// check for backwards words
				for ( var d = 0; d < this.WORDS_TO_MATCH_TRIMMED.length; d++ ) {
					var right_word_reversed = this.WORDS_TO_MATCH_TRIMMED[ d ].split( '' ).reverse().join( '' );
					var index_of_right_word_reversed = diagonal_right_string.indexOf( right_word_reversed );
					if ( -1 !== index_of_right_word_reversed ) {
						console.log( 'Diagonal match (reversed, down and right) for "' + this.WORDS_TO_MATCH[ d ] + '" on row ' + ( i + 1 + index_of_right_word_reversed ) + ' ending at letter #' + ( x + 1 + index_of_right_word_reversed ) );
						this.found_word( i + index_of_right_word_reversed, x + index_of_right_word_reversed, this.WORDS_TO_MATCH_TRIMMED[ d ].length, 'diagonal-right', '#DB2406' );
						this.remove_word_from_list( d );
						d--;
					}
				}
			}
			search_length = 0;

			// get the length of the diagonal from the character down to the left
			if ( x >= this._LENGTH_OF_LONGEST_WORD && this._GRID_ROW_COUNT - i >= this._LENGTH_OF_LONGEST_WORD ) {
				search_length = this._LENGTH_OF_LONGEST_WORD;
			} else if ( x >= this._LENGTH_OF_SHORTEST_WORD && this._GRID_ROW_COUNT - i >= this._LENGTH_OF_SHORTEST_WORD ) {
				search_length = Math.min( x, this._GRID_ROW_COUNT - i );
			}
			
			if ( search_length > 0 ) {

				// the distance to search diagonally from each letter
				for ( var q = 0; q < search_length; q++ ) {
					diagonal_left_string += this.WORD_GRID[ i + q ][ x - q ];
				}
				
				// check if the word exists in the diagonal down and to the left, backwards
				for ( var w = 0; w < this.WORDS_TO_MATCH_TRIMMED.length; w++ ) {
					var index_of_left_word = diagonal_left_string.indexOf( this.WORDS_TO_MATCH_TRIMMED[ w ] );
					if ( -1 !== index_of_left_word ) {
						console.log( 'Diagonal match (reversed, down and left) for "' + this.WORDS_TO_MATCH[ w ] + '" on row ' + ( i + 1 + index_of_left_word ) + ' starting at letter #' + ( x + 1 - index_of_left_word ) );
						this.found_word( i + index_of_left_word, x - index_of_left_word, this.WORDS_TO_MATCH_TRIMMED[ w ].length, 'diagonal-left', '#DB2406' );
						this.remove_word_from_list( w );
						w--;
					}
				}

				// check for forwards words
				for ( var v = 0; v < this.WORDS_TO_MATCH_TRIMMED.length; v++ ) {
					var left_word_reversed = this.WORDS_TO_MATCH_TRIMMED[ v ].split( '' ).reverse().join( '' );
					var index_of_left_word_reversed = diagonal_left_string.indexOf( left_word_reversed );
					if ( -1 !== index_of_left_word_reversed ) {
						console.log( 'Diagonal match (down and left) for "' + this.WORDS_TO_MATCH[ v ] + '" on row ' + ( i + 1 + index_of_left_word_reversed ) + ' starting at letter #' + ( x + 1 - index_of_left_word_reversed ) );
						this.found_word( i + index_of_left_word_reversed, x - index_of_left_word_reversed, this.WORDS_TO_MATCH_TRIMMED[ v ].length, 'diagonal-left', '#DB2406' );
						this.remove_word_from_list( v );
						v--;
					}
				}
			}
		}
	}
};

/**
 * Function: create_display
 * 
 * Description: Dynamically generates the word grid and the word list.
 *
 * Input(s): N/A
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.create_display = function () {
	var table_html = '', list_html = '';

	// set up table
	table_html += '<table><tr><th class="horizontal_header"></th>';

	// set up horizontal headers
	for ( var i = 1; i <= this.WORD_GRID_ROWS[0].length; i++ ) {
		table_html += '<th>' + i + '</th>';
	}
	table_html += '</tr>';
	jQuery.each( this.WORD_GRID, function ( x, row ) {
		
		// set up vertical headers
		table_html += '<tr><th class="vertical_header">' + ( parseInt( x ) + 1 ) + '</th>';
		
		// set up the rest of the row
		jQuery.each( row, function ( x, letter ) {
			table_html += '<td>' + letter + '</td>';
		});
		table_html += '</tr>';
	});
	table_html += '</table>';
	jQuery( '#word_table_container' ).html( table_html );
	
	// table styles
	jQuery( '#word_table_container, #word_table_container th' ).css( 'color', 'white' );
	jQuery( '#word_table_container td' ).css( { 'text-align': 'center', 'color': '#777' } );
	
	// set up list
	list_html += '<ol>';
	for ( var y = 0; y < this.WORDS_TO_MATCH.length; y++ ) {
		list_html += '<li>' + this.WORDS_TO_MATCH[ y ] + '</li>';
	}
	list_html += '</ol>';
	jQuery( '#word_list_container' ).html( list_html );
};

/**
 * Function: clear_alerts
 * 
 * Description: Clears the error notifications on screen and changes the color of all form labels.
 *
 * Input(s): N/A
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.clear_alerts = function () {
	
	// hide the errors
	jQuery( '#word_search_form label' ).css( 'color', '#333' );
	jQuery( '#word_search_form #alert-area' ).hide();
	jQuery( '#word_search_form #alert-list' ).html( '' );
};

/**
 * Function: jump_to_id
 * 
 * Description: Directs the screen to the specified element id, by changing the URL.
 *
 * Input(s):
 * - id (string), the DOM element id in the form of "#my_element".
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.jump_to_id = function ( id ) {
	if ( '' !== id ) {
		var valid_id = id.replace( /^(#)*/, '' );
		
		// force the URL hash to be reset
		window.location.hash = '';
		window.location.hash = valid_id;
	}
};
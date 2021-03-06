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
if ( 'undefined' === typeof( jQuery ) ) {
	jQuery = require( './lib/jquery.min.js' );
}

// this is necessary for testing (compatibility with NodeJS)
if ( 'undefined' !== typeof( module ) ) {
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
 * 		a reference to the current class instance to the loaded function.
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

	// feature sniffing for drag and drop support
	this._IS_ADVANCED_UPLOAD = this.draggable_exists();

	// a File object representing the file uploaded via the form
	this.UPLOADED_FILE_OBJ = null;
	
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
 * Description: Calls get_file_data and creates form event listeners.
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

	if ( self._IS_ADVANCED_UPLOAD ) {

		var file_upload_box = jQuery( '#word_search_form .file_upload_box' );
		file_upload_box.addClass( 'has_advanced_upload' );

		var dropped_file = false;

		file_upload_box.on(
			'drag dragstart dragend dragover dragenter dragleave drop',
			function ( e ) {
				e.preventDefault();
				e.stopPropagation();
			}
		).on(
			'dragover dragenter',
			function () {
				file_upload_box.addClass( 'is_dragover' );
			}
		).on(
			'dragleave dragend drop',
			function () {
				file_upload_box.removeClass( 'is_dragover' );
			}
		).on(
			'drop',
			function ( e ) {
				var files = e.originalEvent.dataTransfer.files;
				self.update_form_file( files, self );
			}
		);
	}

	// file upload field's "files" property was changed
	jQuery( '#word_search_form_file_upload' ).on( 'change', function ( e ) {
		var files = e.currentTarget.files;
		self.update_form_file( files, self );
	});

	// This forces the form method to be the default "manual" setting.
	// This deals with Firefox caching select field values (which is troublesome for UX).
	var form_method_current = jQuery( '#form_method' ).val();
	var form_method_default = jQuery( '#form_method .default_option' ).val();
	if ( form_method_current !== form_method_default ) {
		jQuery( '#form_method' ).val( form_method_default );
	}

	// form type change event listener
	jQuery( '#word_search_form #form_method' ).on(
		'change',
		{ 'self': self },
		self.change_form_display
	);

	jQuery( '.spoiler' ).click( function( e ) {
		var spoiler = e.currentTarget;
		if ( ! jQuery( spoiler ).hasClass( 'spoil_toggled' ) ) {
			jQuery( spoiler ).addClass( 'spoil_toggled' );
			jQuery( spoiler ).siblings( '.spoiler_target' ).show();
		} else {
			jQuery( spoiler ).removeClass( 'spoil_toggled' );
			jQuery( spoiler ).siblings( '.spoiler_target' ).hide();
		}
		jQuery( spoiler ).children( '.spoiler_container' ).toggle();
	});

	// submit button event listener
	jQuery( '#submit' ).on( 'click', { 'self': self }, self.get_form_data );
};

/**
 * Function: get_file_data
 * 
 * Description: Sends a GET request for a data file at a specified path, and sends
 * 		the data to the passed callback.
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
 * Description: Grabs form data and passes it off to the reset_display function.
 *
 * Input(s):
 * - e (object), contains the form click event. The "self" property of the data object attached
 * 		to the event object is a reference to the current class instance.
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.get_form_data = function ( e ) {
	e.preventDefault();

	// disable the button to prevent further submission, while loading
	jQuery( '#submit' ).prop( 'disabled', true ).val( 'Loading...' );

	var self = e.data.self;
	var form_method = jQuery( '#word_search_form #form_method' ).val();

	if ( 'upload' === form_method ) {
		var the_file = self.UPLOADED_FILE_OBJ;

		if ( null !== the_file ) {
			var reader = new FileReader();
			jQuery( reader ).on( 'loadend', function() {
				self.reset_display( reader.result, 'file', self );
			});
			reader.readAsText( the_file );
		} else {
			self.reset_display( '', 'file', self );
		}
	} else if ( 'manual' === form_method ) {
		var word_grid_val = jQuery( '#word_search_form_textarea_grid' ).val();
		var word_list_val = jQuery( '#word_search_form_textarea_list' ).val();

		var new_data = [
			word_grid_val,
			word_list_val
		];
		self.reset_display( new_data, 'form', self );
	}
};

/**
 * Function: map_to_obj
 * 
 * Description: Maps data to an associative array for readability.
 *
 * Input(s):
 * - data (string/array), contains the raw word grid and word list to be mapped.
 * - origin (string), contains the value "file" or "form", and indicates how the data should be 
 *		mapped.
 *
 * Returns: 
 * - (object), on success.
 *		Object format:
 *		{
 * 			'word_grid': ...,
 *			'word_list': ...
 *		}
 * - (null object), when the origin argument is empty.
 *
 */
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
 * Description: Passes data to the validate_data function. If validation succeeds with no errors, 
 *		the searching functions are called.
 *
 * Input(s):
 * - raw_data (string/array), contains the word grid and word list to be processed.
 * - origin (string), contains the value "file" or "form", and is passed to the mapping, 
 *		validation, and search functions.
 * - self (object), contains a reference to the current instance of the
 *		WordSearch class.
 *
 * Returns: N/A
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

		jQuery( 'li.found' ).on( 'click', self.highlight_match );
		self.jump_to_id( 'top' );
	}

	// enable the submit button and reset its text to the default value
	jQuery( '#submit' ).prop( 'disabled', false ).val( 'Submit!' );
};

/**
 * Function: sort_object_array
 * 
 * Description: Serves as a callback to the Array.prototype.sort() function. 
 *		It sorts object arrays.
 *
 * Input(s):
 * - a (object), contains an element of the object array.
 * - b (object), contains the next element of the object array.
 *
 * Returns:
 * - > 0 (int), when the b element's word length is less than a's, b will get bumped below a.
 * - < 0 (int), when the a element's word length is less than b's, a will get bumped below b.
 * - 0 (int), when the indices are the same, nothing happens.
 *
 */
WordSearch.prototype.sort_object_array = function ( a, b ) {
	return b.word.length - a.word.length;
};

/**
 * Function: find_obj_in_arr
 * 
 * Description: Find the first instance of an object with a specific property in an array.
 *
 * Input(s):
 * - arr (array), the array to iterate through.
 * - prop (string), the unique property to look for, in this case "word_id".
 * - value (int), the value to look for.
 *
 * Returns:
 * - (-1) (int), the object was not found.
 * - >= 0 (int), the index of the object in the array.
 *
 */
WordSearch.prototype.find_obj_in_arr = function ( arr, prop, value ) {
	var index = -1;

	if ( 'undefined' !== typeof( arr ) ||
			'undefined' !== typeof( prop ) ||
			'undefined' !== typeof( value ) ) {

		for ( var i = 0; i < arr.length; i++ ) {
			if ( value === arr[ i ][ prop ] ) {
				index = i;
				break;
			}
		}
	}

	return index;
};

/**
 * Function: prepare_search
 * 
 * Description: Receives data from the reset_display function and parses it to get the word grid 
 *		and word list. The raw data has already been mapped, trimmed, and validated before reaching
 *		this function.
 *
 * Input(s):
 * - input_obj (object), contains the grid and word list to be processed.
 * - self (object), contains a reference to the current instance of the
 *		WordSearch class.
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.prepare_search = function ( input_obj, self ) {
	var word_grid = input_obj.word_grid;
	var word_list = input_obj.word_list;
	
	var word_grid_rows = word_grid.split( '\n' );
	
	// reset WORD_GRID and WORD_GRID_ROWS
	self.WORD_GRID = {};
	self.WORD_GRID_ROWS = [];

	for ( var i = 0; i < word_grid_rows.length; i++ ) {
		var word_grid_chars = word_grid_rows[ i ].split( ' ' );
		self.WORD_GRID[ i ] = word_grid_chars;
		self.WORD_GRID_ROWS[ i ] = word_grid_chars.join( ' ' ).replace( /[^\S\n]+/g, '' );
	}

	// reset WORDS_TO_MATCH and WORDS_TO_MATCH_TRIMMED
	self.WORDS_TO_MATCH = [];
	self.WORDS_TO_MATCH_TRIMMED = [];
	
	var words_to_match_array = word_list.split( "\n" );
	jQuery.each( words_to_match_array, function ( i, word ) {
		self.WORDS_TO_MATCH.push( { 'id': i, 'word': word } );
		self.WORDS_TO_MATCH_TRIMMED.push( { 'id': i, 'word': word.replace( /[^\S\n]+/g, '' ) } );
	});
	var sorted_words = self.WORDS_TO_MATCH;
	sorted_words.sort( self.sort_object_array );

	var sorted_words_trimmed = self.WORDS_TO_MATCH_TRIMMED;
	sorted_words_trimmed.sort( self.sort_object_array );
	
	self._LENGTH_OF_LONGEST_WORD = sorted_words_trimmed[0].word.length;
	self._LENGTH_OF_SHORTEST_WORD = sorted_words_trimmed[
		sorted_words_trimmed.length - 1 
	].word.length;
	self._GRID_ROW_COUNT = Object.keys( self.WORD_GRID ).length;
	self._GRID_ROW_LENGTH = self.WORD_GRID[0].length;
	self._MAX_DIAGONAL_LENGTH = Math.min( self._GRID_ROW_COUNT, self._GRID_ROW_LENGTH );
};

/**
 * Function: trim_inputs
 * 
 * Description: Trims inputs and outputs the trimmed data in the same object format it received.
 *
 * Input(s):
 * - input_obj (object), contains the grid and word list to be trimmed.
 *
 * Returns: 
 * - (object), on success, an object with the trimmed strings is returned
 *		Object format:
 *		{
 * 			'word_grid': ...,
 *			'word_list': ...
 *		}
 * - (object), when the input_object argument is empty, an object with empty strings is returned.
 * 		Object format:
 *		{
 * 			'word_grid': '',
 *			'word_list': ''
 *		}
 *
 */
WordSearch.prototype.trim_inputs = function ( input_obj ) {
	if ( 'undefined' === typeof( input_obj.word_grid ) ||
			'undefined' === typeof( input_obj.word_list ) ) {
		return {
			'word_grid': '',
			'word_list': ''
		};
	}

	var word_grid = input_obj.word_grid;
	var word_list = input_obj.word_list;

	/*
	 * - Remove dashes, apostrophes, quotes, and the space around those characters
	 * - Remove extraneous spaces at the beginning and end of the input
	 * - Remove the spaces after newlines to just one newline
	 * - Remove the spaces before newlines
	 * - Add spaces between any adjacent letters
	 * - Make the string uppercase
	 */
	var trimmed_word_grid = word_grid.trim().replace(
		/([^\S\n]*[\'\"\-]+[^\S\n]*)+/g,
		''
	).replace(
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
	).replace(
		/([a-zA-Z]){2,}/g,
		function ( match ) {
			return match.split( '' ).join( ' ' );
		}
	).toUpperCase();

	/*
	 * - Remove dashes, apostrophes, quotes, and the space around those characters
	 * - Reduce groupings of two or more newline characters to one newline character
	 * - Remove whitespace characters that precede newline characters
	 * - Replace groups of one newline character followed by whitespace characters that precede
	 *		an alphabetical character with one newline character
	 * - Replace groups of whitespace characters that precede an alphabetical character with 
	 *		a space
	 * - Make the string uppercase
	 */
	var trimmed_word_list = word_list.trim().replace(
		/([^\S\n]*[\'\"\-]+[^\S\n]*)+/g,
		''
	).replace(
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

/**
 * Function: validate_data
 * 
 * Description: Validates data and returns errors when the data is invalid.
 *
 * Input(s):
 * - input_obj (object), contains the grid and word list to be validated.
 * - origin (string), contains the value "file" or "form", and is used to catch invalid files.
 * - self (object), contains a reference to the current instance of the
 *		WordSearch class.
 *
 * Returns: 
 * - (object array), returns an array of error objects.
 *		Possible errors:
 *		# When the origin is a file and any of the fields are empty.
 *		{ 
 *			'field_type': 'file',
 *			'error_type': 'invalid'
 *		}
 *		# When the origin is a form and the grid field is empty.
 *		{ 
 *			'field_type': 'grid',
 *			'error_type': 'empty'
 *		}
 *		# When the origin is a form and the list field is empty.
 *		{ 
 *			'field_type': 'list',
 *			'error_type': 'empty'
 *		}
 *		# When the grid contains any characters other than alphabetical letters, spaces, dashes,
 *			apostrophes, and quotation marks.
 *		{
 *			'field_type': 'grid',
 *			'error_type': 'non-alpha'
 *		}
 *		# When the list contains any characters other than alphabetical letters, spaces, dashes,
 *			apostrophes, and quotation marks.
 *		{
 *			'field_type': 'list',
 *			'error_type': 'non-alpha'
 *		}
 *		# When the grid contains rows of inconsistent lengths.
 *		{
 *			'field_type': 'grid',
 *			'error_type': 'row-length'
 *		}
 * - (empty array), the array is empty when there are no errors.
 *
 */
WordSearch.prototype.validate_data = function ( input_obj, origin, self ) {
	var error_array = [];
	var trimmed_data_obj = self.trim_inputs( input_obj );
	var word_grid = trimmed_data_obj.word_grid;
	var word_list = trimmed_data_obj.word_list;
	var row_array = word_grid.split( "\n" );

	if ( 'undefined' === typeof( trimmed_data_obj ) ||
			'undefined' === typeof( word_grid ) ||
			'undefined' === typeof( word_list ) ||
			'' === word_grid ||
			'' === word_list ) {
		
		if ( 'file' === origin ) {
			error_array.push(
				{ 
					'field_type': 'file',
					'error_type': 'invalid'
				}
			);
			return error_array;
		} else if ( 'form' === origin ) {
			if ( 'undefined' === typeof( word_grid ) ||
					'' === word_grid ) {
				error_array.push(
					{ 
						'field_type': 'grid',
						'error_type': 'empty'
					}
				);
			}

			if ( 'undefined' === typeof( word_list ) ||
					'' === word_list ) {
				error_array.push(
					{ 
						'field_type': 'list',
						'error_type': 'empty'
					}
				);
			}
		}
	}

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

/**
 * Function: error_handler
 * 
 * Description: Displays errors on screen and highlights form fields that are causing errors.
 *
 * Input(s):
 * - error_array (object array), an array of error objects. See the validate_data function 
 *		for details on return values.
 * - self (object), contains a reference to the current instance of the
 *		WordSearch class.
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.error_handler = function ( error_array, self ) {
	if ( 0 !== error_array.length ) {
		for ( var i = 0; i < error_array.length; i++ ) {
			var error_obj = error_array[ i ];
			var error_msg = '';
			switch ( error_obj.field_type ) {
				case 'grid':
					if ( 'row-length' === error_obj.error_type ) {
						error_msg = 'There is an issue with the grid field! Make sure ' +
							'that the grid rows are all the same length.';
						jQuery( '#word_search_form label[for="word_grid"]' ).addClass( 'error' );
					} else if ( 'empty' === error_obj.error_type ) {
						error_msg = 'The grid field must be filled.';
						jQuery( '#word_search_form label[for="word_grid"]' ).addClass( 'error' );
					} else if ( 'non-alpha' === error_obj.error_type ) {
						error_msg = 'The grid field may only contain ' +
							'alphabetical characters, spaces, dashes, ' +
							'apostrophes, and quotes.';
						jQuery( '#word_search_form label[for="word_grid"]' ).addClass( 'error' );
					}
					break;
				case 'list':
					if ( 'empty' === error_obj.error_type ) {
						error_msg = 'The list field must be filled.';
						jQuery( '#word_search_form label[for="word_list"]' ).addClass( 'error' );
					} else if ( 'non-alpha' === error_obj.error_type ) {
						error_msg = 'The list field may only contain ' +
							'alphabetical characters, spaces, dashes, ' +
							'apostrophes, and quotes.';
						jQuery( '#word_search_form label[for="word_list"]' ).addClass( 'error' );
					}
					break;
				case 'file':
					if ( 'invalid' === error_obj.error_type ) {
						error_msg = 'The input is invalid. Please submit a file with the proper ' +
							'formatting (see below for formatting rules).';
						jQuery( '#word_search_form label[for="word_file"]' ).addClass( 'error' );
					}
					break;
			}
			jQuery( '#word_search_form #alert_list' ).append( '<li>' + error_msg + '</li>' );
			jQuery( '#word_search_form #alert_area' ).show();
			self.jump_to_id( 'alert_area' );
		}
	}
};

/**
 * Function: highlight_match
 * 
 * Description: Highlights the letter on the word grid at the index attached to the clicked
 *		item in the word list.
 *
 * Input(s):
 * - e (object), the click event object.
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.highlight_match = function ( e ) {
	var index_of_match = jQuery( e.currentTarget ).attr( 'data-match-index' );
	var letter_elem = jQuery( '#word_table_container .table_data' ).eq( index_of_match );
	var li_with_index_selector = 'li.found[data-match-index="' + index_of_match + '"]';
	var multiple_items_exist = ( jQuery( li_with_index_selector ).length > 1 ? true : false );
	if ( ! jQuery( letter_elem ).hasClass( 'highlight_match' ) ) {
		jQuery( letter_elem ).addClass( 'highlight_match' );
		jQuery( e.currentTarget ).children().addClass( 'highlight_toggle' );
		if ( multiple_items_exist ) {
			jQuery( e.currentTarget ).siblings( li_with_index_selector ).children().addClass( 
				'highlight_toggle'
			);
		}
	} else {
		jQuery( letter_elem ).removeClass( 'highlight_match' );
		jQuery( li_with_index_selector ).children().removeClass( 'highlight_toggle' );
	}
};

/**
 * Function: found_word
 * 
 * Description: Receives data on the zero-indexed row and column location of the word that has 
 *		been matched. It also receives the type of the match. Each type of match assigns a
 *		different CSS class.
 *
 * Input(s):
 * - row (int), zero-indexed y-axis location of the match.
 * - column (int), zero-indexed x-axis location of the match.
 * - word_length (int), the length of the matched word, used to iterate over the word grid.
 * - match_type (string), indicates the direction of the match: "row" (horizontal), 
 *		"column" (vertical), "diagonal-right", or "diagonal-left".
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.found_word = function ( row, column, word_length, match_type ) {
	
	// some styling to point out matched words
	for ( var i = 0; i < word_length; i++ ) {
		switch ( match_type ) {
			case 'row':
				jQuery( '#word_table_container td' ).eq(
					( column + i ) + this._GRID_ROW_LENGTH * row 
				).addClass( 'row_match' );
				break;
			case 'column':
				jQuery( '#word_table_container td' ).eq(
					column + this._GRID_ROW_LENGTH * ( row + i )
				).addClass( 'column_match' );
				break;
			case 'diagonal-right':
				jQuery( '#word_table_container td' ).eq(
					( column + i ) + this._GRID_ROW_LENGTH * ( row + i )
				).addClass( 'diagonal_match' );
				break;
			case 'diagonal-left':
				jQuery( '#word_table_container td' ).eq(
					column + ( this._GRID_ROW_LENGTH * ( row + i ) - i )
				).addClass( 'diagonal_match' );
				break;
			default:
				return;
		}
	}
};

/**
 * Function: remove_word_from_list
 * 
 * Description: Removes the word at the received index in the word list global variables and
 *		styles the displayed word list to reflect that the word has been found.
 *
 * Input(s):
 * - word_id (int), the unique id of the word to be removed from the trimmed and untrimmed word
 *		word lists.
 * - row (int), the zero-indexed number representing the row that the word was found on.
 * - col (int), the zero-indexed number representing the column that the word was found on.
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.remove_word_from_list = function ( word_id, row, col ) {
	var match_index = col + this._GRID_ROW_LENGTH * row;
	var untrimmed_index = this.find_obj_in_arr(
		this.WORDS_TO_MATCH,
		'id',
		word_id
	);
	var trimmed_index = this.find_obj_in_arr(
		this.WORDS_TO_MATCH_TRIMMED,
		'id',
		word_id
	);

	// scratch the word out on the list
	var list_item = jQuery(
		'#word_list_container li:contains(' + this.WORDS_TO_MATCH[ untrimmed_index ].word + ')'
	).addClass(
		'found'
	).attr( 
		'data-match-index',
		match_index
	);

	// if we've already matched the word, we don't need to search for it again.
	this.WORDS_TO_MATCH.splice( untrimmed_index, 1 );
	this.WORDS_TO_MATCH_TRIMMED.splice( trimmed_index, 1 );
};

/**
 * Function: search_for_words
 * 
 * Description: Handles calling the various search functions and adds some formatting to the 
 *		JavaScript console.
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
 * Description: Searches every row in the word grid (using the WORD_GRID_ROWS array, 
 *		which stores rows as strings) and compares each row against the word list to find a match.
 *		First they are compared normally, then the word list is reversed and compared again.
 *		When a word is found, the match is logged, highlighted, and removed from the word list.
 *		To mitigate the change in the length of the word list, the for-loop counter
 *		is then decremented.
 *
 * Input(s): N/A
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.search_row = function () {
	for ( var i = 0; i < this.WORD_GRID_ROWS.length; i++ ) {
		for ( var x = 0; x < this.WORDS_TO_MATCH_TRIMMED.length; x++ ) {
			
			var word_x = this.WORDS_TO_MATCH_TRIMMED[ x ].word;
			var word_id_x = this.WORDS_TO_MATCH_TRIMMED[ x ].id;

			// search for forwards words in the row
			var index_of_word = this.WORD_GRID_ROWS[ i ].indexOf(
				word_x
			);
			if ( -1 !== index_of_word ) {
				var untrimmed_index_x = this.find_obj_in_arr( 
					this.WORDS_TO_MATCH,
					'id',
					word_id_x
				);
				var untrimmed_word_x = this.WORDS_TO_MATCH[ untrimmed_index_x ].word;

				console.log(
					'Horizontal match for "' +
					untrimmed_word_x +
					'" on row ' + ( i + 1 ) +
					' starting at letter #' +
					( index_of_word + 1 )
				);
				this.found_word(
					i,
					index_of_word,
					untrimmed_word_x.length,
					'row',
					'#54A9CC'
				);
				this.remove_word_from_list( word_id_x, i, index_of_word );
				x--;
			}
		}
		for ( var y = 0; y < this.WORDS_TO_MATCH_TRIMMED.length; y++ ) {

			var word_y = this.WORDS_TO_MATCH_TRIMMED[ y ].word;
			var word_id_y = this.WORDS_TO_MATCH_TRIMMED[ y ].id;

			// search for backwards words in the row, by flipping the search word
			var word_reversed = word_y.split( '' ).reverse().join( '' );
			var index_of_word_reversed = this.WORD_GRID_ROWS[ i ].indexOf( word_reversed );
			if ( -1 !== index_of_word_reversed ) {
				var untrimmed_index_y = this.find_obj_in_arr( 
					this.WORDS_TO_MATCH,
					'id',
					word_id_y
				);
				var untrimmed_word_y = this.WORDS_TO_MATCH[ untrimmed_index_y ].word;

				console.log(
					'Horizontal match (reversed) for "' +
					untrimmed_word_y +
					'" on row ' +
					( i + 1 ) +
					' ending at letter #' +
					( index_of_word_reversed + 1 )
				);
				this.found_word(
					i,
					index_of_word_reversed,
					untrimmed_word_y.length,
					'row',
					'#54A9CC'
				);
				this.remove_word_from_list( word_id_y, i, index_of_word_reversed );
				y--;
			}
		}
	}
};

/**
 * Function: search_column
 * 
 * Description: Searches every column in the word grid by using the first row of the 
 *		WORD_GRID_ROWS array. Every column is combined into a string and then compared against
 *		the word list. First they are compared normally, then the words are reversed and 
 *		compared again. When a word is found, the match is logged, highlighted, and removed from
 *		the word list. To mitigate the change in the length of the word list, the for-loop counter
 *		is then decremented.
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
			var word_y = this.WORDS_TO_MATCH_TRIMMED[ y ].word;
			var word_id_y = this.WORDS_TO_MATCH_TRIMMED[ y ].id;

			var index_of_word = column_string.indexOf( word_y );
			if ( -1 !== index_of_word ) {
				var untrimmed_index_y = this.find_obj_in_arr( 
					this.WORDS_TO_MATCH,
					'id',
					word_id_y
				);
				var untrimmed_word_y = this.WORDS_TO_MATCH[ untrimmed_index_y ].word;

				console.log(
					'Vertical match for "' +
					untrimmed_word_y +
					'" on row ' +
					( index_of_word + 1 ) +
					' starting at letter #' +
					( i + 1 )
				);
				this.found_word(
					index_of_word,
					i,
					untrimmed_word_y.length,
					'column',
					'#EEEEEE'
				);
				this.remove_word_from_list( word_id_y, index_of_word, i );
				y--;
			}
		}

		// search for backwards words
		for ( var z = 0; z < this.WORDS_TO_MATCH_TRIMMED.length; z++ ) {
			var word_z = this.WORDS_TO_MATCH_TRIMMED[ z ].word;
			var word_id_z = this.WORDS_TO_MATCH_TRIMMED[ z ].id;

			var word_reversed = word_z.split( '' ).reverse().join( '' );
			var index_of_word_reversed = column_string.indexOf( word_reversed );
			if ( -1 !== index_of_word_reversed ) {
				var untrimmed_index_z = this.find_obj_in_arr( 
					this.WORDS_TO_MATCH,
					'id',
					word_id_z
				);
				var untrimmed_word_z = this.WORDS_TO_MATCH[ untrimmed_index_z ].word;

				console.log(
					'Vertical match (reversed) for "' +
					untrimmed_word_z +
					'" on row ' +
					( index_of_word_reversed + 1 ) +
					' ending at letter #' +
					( i + 1 )
				);
				this.found_word(
					index_of_word_reversed,
					i,
					untrimmed_word_z.length,
					'column',
					'#EEEEEE'
				);
				this.remove_word_from_list( word_id_z, index_of_word_reversed, i );
				z--;
			}
		}
	}
};

/**
 * Function: search_diagonal
 * 
 * Description: Loops through every row and column to check for diagonal matches to the left 
 *		and right of every character. Characters in positions on the grid that could not possibly 
 *		have diagonal matches will be ignored. If the dimensions of the grid are not large enough 
 *		to allow for diagonal matches with the provided word list, a notification will be logged 
 *		and the function will return nothing. The length of the search at each character is 
 *		determined by the grid dimensions, the character's position on the grid, and the length of
 *		the longest word. The search length can't be larger than the length of the shortest word. 
 *		If the search length is less than the maximum diagonal length on the grid, a string will 
 *		be generated and compared against the word list. When a word is found, the match is logged,
 *		highlighted, and removed from the word list. To mitigate the change in the length of the 
 *		word list, the for-loop counter is decremented.
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
			if ( this._GRID_ROW_LENGTH - x >= this._LENGTH_OF_LONGEST_WORD &&
					this._GRID_ROW_COUNT - i >= this._LENGTH_OF_LONGEST_WORD ) {

				search_length = this._LENGTH_OF_LONGEST_WORD;
			} else if ( this._GRID_ROW_LENGTH - x >= this._LENGTH_OF_SHORTEST_WORD &&
					this._GRID_ROW_COUNT - i >= this._LENGTH_OF_SHORTEST_WORD ) {

				search_length = Math.min( this._GRID_ROW_LENGTH - x, this._GRID_ROW_COUNT - i );
			}
			if ( search_length > 0 ) {

				// the distance to search diagonally from each letter
				for ( var y = 0; y < search_length; y++ ) {
					diagonal_right_string += this.WORD_GRID[ i + y ][ x + y ];
				}

				// check if the word exists in the diagonal down and to the right, forwards
				for ( var z = 0; z < this.WORDS_TO_MATCH_TRIMMED.length; z++ ) {
					var word_z = this.WORDS_TO_MATCH_TRIMMED[ z ].word;
					var word_id_z = this.WORDS_TO_MATCH_TRIMMED[ z ].id;
					
					var index_of_right_word = diagonal_right_string.indexOf(
						word_z
					);
					if ( -1 !== index_of_right_word ) {
						var untrimmed_index_z = this.find_obj_in_arr( 
							this.WORDS_TO_MATCH,
							'id',
							word_id_z
						);
						var untrimmed_word_z = this.WORDS_TO_MATCH[ untrimmed_index_z ].word;

						console.log(
							'Diagonal match (down and right) for "' +
							untrimmed_word_z +
							'" on row ' +
							( i + 1 + index_of_right_word ) +
							' starting at letter #' +
							( x + 1 + index_of_right_word )
						);
						this.found_word(
							i + index_of_right_word,
							x + index_of_right_word,
							untrimmed_word_z.length,
							'diagonal-right',
							'#DB2406'
						);
						this.remove_word_from_list(
							word_id_z,
							i + index_of_right_word,
							x + index_of_right_word
						);
						z--;
					}
				}

				// check for backwards words
				for ( var d = 0; d < this.WORDS_TO_MATCH_TRIMMED.length; d++ ) {
					var word_d = this.WORDS_TO_MATCH_TRIMMED[ d ].word;
					var word_id_d = this.WORDS_TO_MATCH_TRIMMED[ d ].id;

					var right_word_reversed = word_d.
						split( '' ).
						reverse().
						join( '' );
					var index_of_right_word_reversed = diagonal_right_string.indexOf(
						right_word_reversed
					);
					if ( -1 !== index_of_right_word_reversed ) {
						var untrimmed_index_d = this.find_obj_in_arr( 
							this.WORDS_TO_MATCH,
							'id',
							word_id_d
						);
						var untrimmed_word_d = this.WORDS_TO_MATCH[ untrimmed_index_d ].word;

						console.log(
							'Diagonal match (reversed, down and right) for "' +
							untrimmed_word_d +
							'" on row ' +
							( i + 1 + index_of_right_word_reversed ) +
							' ending at letter #' +
							( x + 1 + index_of_right_word_reversed )
						);
						this.found_word(
							i + index_of_right_word_reversed,
							x + index_of_right_word_reversed,
							untrimmed_word_d.length,
							'diagonal-right',
							'#DB2406'
						);
						this.remove_word_from_list(
							word_id_d,
							i + index_of_right_word_reversed,
							x + index_of_right_word_reversed
						);
						d--;
					}
				}
			}
			search_length = 0;

			// get the length of the diagonal from the character down to the left
			if ( x >= this._LENGTH_OF_LONGEST_WORD &&
					this._GRID_ROW_COUNT - i >= this._LENGTH_OF_LONGEST_WORD ) {

				search_length = this._LENGTH_OF_LONGEST_WORD;
			} else if ( x >= this._LENGTH_OF_SHORTEST_WORD &&
					this._GRID_ROW_COUNT - i >= this._LENGTH_OF_SHORTEST_WORD ) {
				search_length = Math.min( x, this._GRID_ROW_COUNT - i );
			}
			
			if ( search_length > 0 ) {

				// the distance to search diagonally from each letter
				for ( var q = 0; q < search_length; q++ ) {
					diagonal_left_string += this.WORD_GRID[ i + q ][ x - q ];
				}
				
				// check if the word exists in the diagonal down and to the left, backwards
				for ( var w = 0; w < this.WORDS_TO_MATCH_TRIMMED.length; w++ ) {
					var word_w = this.WORDS_TO_MATCH_TRIMMED[ w ].word;
					var word_id_w = this.WORDS_TO_MATCH_TRIMMED[ w ].id;

					var index_of_left_word = diagonal_left_string.indexOf(
						word_w
					);
					if ( -1 !== index_of_left_word ) {
						var untrimmed_index_w = this.find_obj_in_arr( 
							this.WORDS_TO_MATCH,
							'id',
							word_id_w
						);
						var untrimmed_word_w = this.WORDS_TO_MATCH[ untrimmed_index_w ].word;

						console.log(
							'Diagonal match (reversed, down and left) for "' +
							untrimmed_word_w +
							'" on row ' +
							( i + 1 + index_of_left_word ) +
							' starting at letter #' +
							( x + 1 - index_of_left_word )
						);
						this.found_word(
							i + index_of_left_word,
							x - index_of_left_word,
							untrimmed_word_w.length,
							'diagonal-left',
							'#DB2406'
						);
						this.remove_word_from_list(
							word_id_w,
							i + index_of_left_word,
							x - index_of_left_word
						);
						w--;
					}
				}

				// check for forwards words
				for ( var v = 0; v < this.WORDS_TO_MATCH_TRIMMED.length; v++ ) {
					var word_v = this.WORDS_TO_MATCH_TRIMMED[ v ].word;
					var word_id_v = this.WORDS_TO_MATCH_TRIMMED[ v ].id;

					var left_word_reversed = word_v.
						split( '' ).
						reverse().
						join( '' );
					var index_of_left_word_reversed = diagonal_left_string.indexOf(
						left_word_reversed
					);
					if ( -1 !== index_of_left_word_reversed ) {
						var untrimmed_index_v = this.find_obj_in_arr( 
							this.WORDS_TO_MATCH,
							'id',
							word_id_v
						);
						var untrimmed_word_v = this.WORDS_TO_MATCH[ untrimmed_index_v ].word;

						console.log(
							'Diagonal match (down and left) for "' +
							untrimmed_word_v +
							'" on row ' +
							( i + 1 + index_of_left_word_reversed ) +
							' starting at letter #' +
							( x + 1 - index_of_left_word_reversed )
						);
						this.found_word(
							i + index_of_left_word_reversed,
							x - index_of_left_word_reversed,
							untrimmed_word_v.length,
							'diagonal-left',
							'#DB2406'
						);
						this.remove_word_from_list(
							word_id_v,
							i + index_of_left_word_reversed,
							x - index_of_left_word_reversed
						);
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
 * Description: Dynamically generates the word grid and the word list on the page.
 *
 * Input(s): N/A
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.create_display = function () {
	var table_html = '', list_html = '';

	// set up table, and add an empty header tag (top left blank space)
	table_html += '<table><tr><th class="table_header"></th>';

	// set up horizontal headers
	for ( var i = 1; i <= this._GRID_ROW_LENGTH; i++ ) {
		table_html += '<th class="table_header">' + i + '</th>';
	}
	table_html += '</tr>';
	jQuery.each( this.WORD_GRID, function ( x, row ) {
		
		// set up vertical headers
		table_html += '<tr><th class="table_header">' + ( parseInt( x ) + 1 ) + '</th>';
		
		// set up the rest of the row
		jQuery.each( row, function ( y, letter ) {
			table_html += '<td class="table_data">' + letter + '</td>';
		});
		table_html += '</tr>';
	});
	table_html += '</table>';
	jQuery( '#word_table_container' ).html( table_html );
	
	// set up list
	list_html += '<ol>';
	for ( var y = 0; y < this.WORDS_TO_MATCH.length; y++ ) {
		list_html += '<li><span>' + this.WORDS_TO_MATCH[ y ].word + '</span></li>';
	}
	list_html += '</ol>';
	jQuery( '#word_list_container' ).html( list_html );
};

/**
 * Function: update_form_file
 * 
 * Description: Changes the file upload label to display the name of the file selected for upload.
 *
 * Input(s):
 * - files (object), the FileList object containing the file to read from.
 * - self (object), contains a reference to the current instance of the
 *		WordSearch class.
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.update_form_file = function ( files, self ) {
	if ( 'undefined' !== typeof( files[0] ) ) {
		var file = files[0];
		var new_file_name = file.name;
		var file_form = jQuery( '#word_search_form_file_upload' )[0];

		jQuery( '.file_upload_input label[for="word_search_form_file_upload"]' ).html( 
			new_file_name
		);
		self.UPLOADED_FILE_OBJ = file;
	}
};

/**
 * Function: change_form_display
 * 
 * Description: Changes the form to display the correct set of form inputs based on the desired
 *		input method. The two methods should be manual entry and file upload.
 *
 * Input(s):
 * - e (object), the change event object on the #form_method select field. The "self"
 *		property of the "data" object attached to the event object is a reference to the current
 *		class instance.
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.change_form_display = function ( e ) {
	var self = e.data.self;
	var new_method = e.currentTarget.value;

	self.clear_alerts();

	if ( 'upload' === new_method ) {
		jQuery( '#form_manual_method' ).hide();
		jQuery( '#form_upload_method' ).show();
	} else if ( 'manual' === new_method ) {
		jQuery( '#form_upload_method' ).hide();
		jQuery( '#form_manual_method' ).show();
	}
};

/**
 * Function: draggable_exists
 * 
 * Description: Figures out if the browser supports drag and drop.
 *
 * Input(s): N/A
 *
 * Returns:
 * - true (bool), when the browser supports drag and drop and file reading.
 * - false (bool), when the browser doesn't support drag and drop or file reading.
 *
 */
WordSearch.prototype.draggable_exists = function () {
	var div = document.createElement( 'div' );
	var draggable = 'draggable' in div;
	var drag_start_and_drop = ( 'ondragstart' in div && 'ondrop' in div );
	var file_reader = 'FileReader' in window;
	var form_data = 'FormData' in window;

	if ( ( draggable || drag_start_and_drop ) &&
			file_reader &&
			form_data ) {
		return true;
	} else {
		return false;
	}
};

/**
 * Function: clear_alerts
 * 
 * Description: Clears the error notifications on screen and removes the error CSS class
 *		from all form labels.
 *
 * Input(s): N/A
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.clear_alerts = function () {
	
	// hide the errors
	jQuery( '#word_search_form label' ).removeClass( 'error' );
	jQuery( '#word_search_form #alert_area' ).hide();
	jQuery( '#word_search_form #alert_list' ).html( '' );
};

/**
 * Function: jump_to_id
 * 
 * Description: Directs the screen to the specified element id, by changing the URL hash.
 *
 * Input(s):
 * - id (string), the DOM element id in the form of "#my_element" or "my_element" (without the
 *		"#" in front).
 *
 * Returns: N/A
 *
 */
WordSearch.prototype.jump_to_id = function ( id ) {
	if ( '' !== id ) {
		var valid_id = id.replace( /^(#)*/, '' );
		
		// reset the URL hash
		window.location.hash = '';
		window.location.hash = valid_id;
	}
};
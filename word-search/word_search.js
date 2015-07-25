( function() {

	// an object full of arrays of characters that represent rows broken apart
	var WORD_GRID = {};
	
	// an array full of strings that are the rows' characters pieced together
	var WORD_GRID_ROWS = [];
	
	// an array of words to search for
	var WORDS_TO_MATCH = [];
	var WORDS_TO_MATCH_TRIMMED = [];
	
	var _LENGTH_OF_LONGEST_WORD = 0;
	var _LENGTH_OF_SHORTEST_WORD = 0;
	var _MAX_DIAGONAL_LENGTH = 0;
	var _GRID_ROW_COUNT = 0;
	var _GRID_ROW_LENGTH = 0;

	// start the program when the page has been fully loaded
	jQuery( document ).ready( function() {
		jQuery.get( 
			'word-search.txt', 
			function( data ) {
				reset_display( data, 'file' );
			}
		);

		jQuery( 'input[type="submit"]' ).click( function( e ) {
			e.preventDefault();
			if ( '' != document.forms['word_search_form']['word_grid'].value && 
				 '' != document.forms['word_search_form']['word_list'].value 
			) {
				reset_display( [
						document.forms['word_search_form']['word_grid'].value,
						document.forms['word_search_form']['word_list'].value
					],
					'form' 
				);

				// bring the user back up to the top of the grid (slightly under the top of the screen)
				window.location = '#top';
			} else if ( '' == document.forms['word_search_form']['word_grid'].value &&
						'' == document.forms['word_search_form']['word_list'].value
			) {
				display_error( 'empty', 'Enter a word grid and a list of words to search for.' );
			} else if ( '' == document.forms['word_search_form']['word_grid'].value ) {
				display_error( 'empty', 'Enter a word grid.', 'grid' );
			} else if ( '' == document.forms['word_search_form']['word_list'].value ) {
				display_error( 'empty', 'Enter a list of words to search for.', 'list' );
			}
		});
	});

	var reset_display = function( data, data_type ) {
		get_words( data, data_type );
		create_display();
		search_for_words();
	};

	var display_error = function( error, msg, label_type ) {
		if ( 'empty' == error && 'undefined' == typeof( label_type ) ) {
			jQuery( '#word_search_form label' ).css( 'color', 'red' );
		} else if ( 'non-alpha' == error || 'row-length' == error || 'undefined' != typeof( label_type ) ) {
			jQuery( '#word_search_form label[for="word_' + label_type + '"]' ).css( 'color', 'red' );
		} else {
			return;
		}
		alert( msg );
	};

	var validate_input = function( input, type ) {
		if ( input.match( /[^a-zA-Z\s]/ ) ) {
			display_error( 'non-alpha', 'Only letters and spaces are allowed in the ' + type + ' field.', type );
			return;
		}

		// there are only letters and whitespace in the string, so reset
		// the color of the labels
		jQuery( '#word_search_form label[for="word_' + type + '"]' ).css( 'color', 'black' );
		if ( 'grid' == type ) {

			// holds the indices of rows that are not the same length
			var inconsistent_rows = [];

			// remove extraneous spaces at the beginning and end of the input,
			// then remove the spaces before and after newlines,
			// then add spaces between any adjacent letters,
			// finally make the string uppercase.
			var trimmed_input = input.trim().replace(
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
				function( match ) {
					return match.split( '' ).join( ' ' );
				} 
			).toUpperCase();

			// check the length of each row in the word grid, they should all be the same
			var trimmed_input_array = trimmed_input.split( '\n' );
			for ( var i = 0; i < trimmed_input_array.length; i++ ) {
				if ( trimmed_input_array[ i ].length != trimmed_input_array[0].length ) {
					inconsistent_rows.push( i + 1 );
				}
			}

			if ( 0 != inconsistent_rows.length ) {
				display_error(
					'row-length',
					"The word grid's rows must all be the same length. Check row" +
						( 1 == inconsistent_rows.length ? '' : 's' ) +
						': ' + inconsistent_rows.join( ', ' ),
					type
				);
				return;
			} else {
				return trimmed_input;	
			}
		} else if ( 'list' == type ) {

			// remove spaces from the element and remove any extra newline characters
			var word_list = input.trim().replace(
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

			return word_list;
		}
	};

	var get_words = function( data, data_type ) {
		if ( 'undefined' === typeof( data_type ) ) {
			data_type = 'file';
		}
		
		var split_data;
		var word_grid_string = '';
		if ( 'form' == data_type ) {
			word_grid_string = validate_input( data[0], 'grid' );
		} else if ( 'file' == data_type ) {
			split_data = data.split( /(\n){2}/g );
			word_grid_string = validate_input( split_data[0], 'grid' );
		}
		var word_grid_rows = word_grid_string.split( '\n' );
		
		// reset WORD_GRID
		WORD_GRID = {};
		WORD_GRID_ROWS = [];
		for ( var i = 0; i < word_grid_rows.length; i++ ) {
			var word_grid_chars = word_grid_rows[ i ].split( ' ' );
			for ( var x = 0; x < word_grid_chars.length; x++ ) {
				WORD_GRID[ i ] = word_grid_chars;
				WORD_GRID_ROWS[ i ] = word_grid_chars.join( ' ' ).replace( /[^\S\n]+/g, '' );
			}
		}

		// reset WORDS_TO_MATCH & WORDS_TO_MATCH_TRIMMED
		WORDS_TO_MATCH = [];
		WORDS_TO_MATCH_TRIMMED = [];
		var words_to_match_string = '';
		if ( 'form' == data_type ) {
			words_to_match_string = validate_input( data[1], 'list' );
		} else if ( 'file' == data_type ) {
			words_to_match_string = validate_input( split_data[4], 'list' );
		}
		var words_to_match_array = words_to_match_string.split( "\n" );
		jQuery.each( words_to_match_array, function( i, word ) {
			WORDS_TO_MATCH.push( word );
			WORDS_TO_MATCH_TRIMMED.push( word.replace( /[^\S\n]+/g, '' ) );
		});

		var sorted_words = WORDS_TO_MATCH;
		sorted_words.sort( function( a, b ) {
			
			// returns > 0 -> b's index gets bumped below a's
			// returns < 0 -> a's index gets bumbed below b's
			// returns 0   -> indices are the same
			return b.length - a.length;
		});
		var sorted_words_trimmed = WORDS_TO_MATCH_TRIMMED;
		sorted_words_trimmed.sort( function( a, b ) {
			return b.length - a.length;
		});
		_LENGTH_OF_LONGEST_WORD = sorted_words_trimmed[0].length;
		_LENGTH_OF_SHORTEST_WORD = sorted_words_trimmed[ sorted_words_trimmed.length - 1 ].length;
		_GRID_ROW_COUNT = Object.keys( WORD_GRID ).length;
		_GRID_ROW_LENGTH = WORD_GRID[0].length;
		_MAX_DIAGONAL_LENGTH = Math.min( _GRID_ROW_COUNT, _GRID_ROW_LENGTH );
	};

	var search_for_words = function() {
		search_row();
		search_column();
		search_diagonal();
	};

	var remove_word_from_list = function( index ) {

		// scratch the word out on the list
		jQuery( '#word_list_container li:contains(' + WORDS_TO_MATCH[ index ] + ')' ).css( { 'color': '#777' } );

		// if we've already matched the word, we don't need to search for it again.
		WORDS_TO_MATCH.splice( index, 1 );
		WORDS_TO_MATCH_TRIMMED.splice( index, 1 );
	};

	var found_word = function( row, column, word, match_type, color ) {
		if ( 'undefined' == typeof( color ) ) {
			color = 'red';
		}

		// some styling to point out matched words
		for ( var i = 0; i < word.length; i++ ) {
			switch ( match_type ) {
				case 'row':
					jQuery( '#word_table_container td' ).eq( ( column + i ) + _GRID_ROW_LENGTH * row ).css( 'background-color', color );
					break;
				case 'column':
					jQuery( '#word_table_container td' ).eq( column + _GRID_ROW_LENGTH * ( row + i ) ).css( 'background-color', color );
					break;
				case 'diagonal-right':
					jQuery( '#word_table_container td' ).eq( ( column + i ) + _GRID_ROW_LENGTH * ( row + i ) ).css( { 'background-color': color } );
					break;
				case 'diagonal-left':
					jQuery( '#word_table_container td' ).eq( column + ( _GRID_ROW_LENGTH * ( row + i ) - i ) ).css( { 'background-color': color } );
					break;
				default:
					return;
			}
		}
	};

	var search_row = function() {
		for ( var i = 0; i < WORD_GRID_ROWS.length; i++ ) {

			for ( var x = 0; x < WORDS_TO_MATCH_TRIMMED.length; x++ ) {
				
				// search for forwards words in the row
				var index_of_word = WORD_GRID_ROWS[ i ].indexOf( WORDS_TO_MATCH_TRIMMED[ x ] );
				if ( -1 !== index_of_word ) {
					console.log( 'Horizontal match for "' + WORDS_TO_MATCH[ x ] + '" on row ' + ( i + 1 ) + ' starting at letter #' + ( index_of_word + 1 ) );
					found_word( i, index_of_word, WORDS_TO_MATCH_TRIMMED[ x ], 'row' );
					remove_word_from_list( x );
				}
			}

			for ( var y = 0; y < WORDS_TO_MATCH_TRIMMED.length; y++ ) {

				// search for backwards words in the row, by flipping the search word
				var word_reversed = WORDS_TO_MATCH_TRIMMED[ y ].split( '' ).reverse().join( '' );
				var index_of_word_reversed = WORD_GRID_ROWS[ i ].indexOf( word_reversed );
				if ( -1 !== index_of_word_reversed ) {
					console.log( 'Horizontal match (reversed) for "' + WORDS_TO_MATCH[ y ] + '" on row ' + ( i + 1 ) + ' starting at letter #' + ( index_of_word_reversed + 1 ) );
					found_word( i, index_of_word_reversed, WORDS_TO_MATCH_TRIMMED[ y ], 'row' );
					remove_word_from_list( y );
				}
			}
		}
	};

	var search_column = function() {

		// iterate over the first row, looking at each column
		for ( var i = 0; i < WORD_GRID_ROWS[0].length; i++ ) {

			// piece together each column into a searchable string
			var column_string = '';
			for ( var x = 0; x < Object.keys( WORD_GRID ).length; x++ ) {
				column_string += WORD_GRID[ x ][ i ];
			}

			// search for words
			for ( var y = 0; y < WORDS_TO_MATCH_TRIMMED.length; y++ ) {
				var index_of_word = column_string.indexOf( WORDS_TO_MATCH_TRIMMED[ y ] );
				if ( -1 !== index_of_word ) {
					console.log( 'Vertical match for "' + WORDS_TO_MATCH[ y ] + '" on row ' + ( index_of_word + 1 ) + ' starting at letter #' + ( i + 1 ) );
					found_word( index_of_word, i, WORDS_TO_MATCH_TRIMMED[ y ], 'column', 'lightgreen' );
					remove_word_from_list( y );
				}
			}

			// search for backwards words
			for ( var z = 0; z < WORDS_TO_MATCH_TRIMMED.length; z++ ) {
				var word_reversed = WORDS_TO_MATCH_TRIMMED[ z ].split( '' ).reverse().join( '' );
				var index_of_word_reversed = column_string.indexOf( word_reversed );
				if ( -1 !== index_of_word_reversed ) {
					console.log( 'Vertical match (reversed) for "' + WORDS_TO_MATCH[ z ] + '" on row ' + ( index_of_word_reversed + 1 ) + ' starting at letter #' + ( i + 1 ) );
					found_word( index_of_word_reversed, i, WORDS_TO_MATCH_TRIMMED[ z ], 'column', 'lightgreen' );
					remove_word_from_list( z );
				}
			}
		}
	};

	var search_diagonal = function() {

		if ( _MAX_DIAGONAL_LENGTH < _LENGTH_OF_SHORTEST_WORD ) {
			console.log( "Not enough space to search diagonally." );
			return;
		}

		// iterate over each row - traverses up and down
		for ( var i = 0; i < Object.keys( WORD_GRID ).length; i++ ) {

			// iterate over each column - traverses left and right
			for ( var x = 0; x < WORD_GRID[ i ].length; x++ ) {
				
				// for each character, we check down the the left and right, 
				// and up to the left and right
				var diagonal_right_string = '';
				var diagonal_left_string = '';
				var search_length = 0;
				
				// get the length of the diagonal from the character down to the right
				if ( _GRID_ROW_LENGTH - x >= _LENGTH_OF_LONGEST_WORD && _GRID_ROW_COUNT - i >= _LENGTH_OF_LONGEST_WORD ) {
					search_length = _LENGTH_OF_LONGEST_WORD;
				} else if ( _GRID_ROW_LENGTH - x >= _LENGTH_OF_SHORTEST_WORD && _GRID_ROW_COUNT - i >= _LENGTH_OF_SHORTEST_WORD ) {
					search_length = Math.min( _GRID_ROW_LENGTH - x, _GRID_ROW_COUNT - i );
				}

				if ( search_length > 0 ) {

					// the distance to search diagonally from each letter
					for ( var y = 0; y < search_length; y++ ) {
						diagonal_right_string += WORD_GRID[ i + y ][ x + y ];
					}

					// check if the word exists in the diagonal down and to the right, forwards
					for ( var z = 0; z < WORDS_TO_MATCH_TRIMMED.length; z++ ) {
						var index_of_right_word = diagonal_right_string.indexOf( WORDS_TO_MATCH_TRIMMED[ z ] );
						if ( -1 !== index_of_right_word ) {
							console.log( 'Diagonal match (down and right) for "' + WORDS_TO_MATCH[ z ] + '" on row ' + ( i + 1 + index_of_right_word ) + ' starting at letter #' + ( x + 1 + index_of_right_word ) );
							found_word( i + index_of_right_word, x + index_of_right_word, WORDS_TO_MATCH_TRIMMED[ z ], 'diagonal-right', 'yellow' );
							remove_word_from_list( z );
						}
					}

					// check for backwards words
					for ( var d = 0; d < WORDS_TO_MATCH_TRIMMED.length; d++ ) {
						var right_word_reversed = WORDS_TO_MATCH_TRIMMED[ d ].split( '' ).reverse().join( '' );
						var index_of_right_word_reversed = diagonal_right_string.indexOf( right_word_reversed );
						if ( -1 !== index_of_right_word_reversed ) {
							console.log( 'Diagonal match (reversed, down and right) for "' + WORDS_TO_MATCH[ d ] + '" on row ' + ( i + 1 + index_of_right_word_reversed ) + ' starting at letter #' + ( x + 1 + index_of_right_word_reversed ) );
							found_word( i + index_of_right_word_reversed, x + index_of_right_word_reversed, WORDS_TO_MATCH_TRIMMED[ d ], 'diagonal-right', 'yellow' );
							remove_word_from_list( d );
						}
					}
				}

				search_length = 0;

				// get the length of the diagonal from the character down to the left
				if ( x >= _LENGTH_OF_LONGEST_WORD && _GRID_ROW_COUNT - i >= _LENGTH_OF_LONGEST_WORD ) {
					search_length = _LENGTH_OF_LONGEST_WORD;
				} else if ( x >= _LENGTH_OF_SHORTEST_WORD && _GRID_ROW_COUNT - i >= _LENGTH_OF_SHORTEST_WORD ) {
					search_length = Math.min( x, _GRID_ROW_COUNT - i );
				}
				
				if ( search_length > 0 ) {

					// the distance to search diagonally from each letter
					for ( var q = 0; q < search_length; q++ ) {
						diagonal_left_string += WORD_GRID[ i + q ][ x - q ];
					}
					
					// check if the word exists in the diagonal down and to the left, backwards
					for ( var w = 0; w < WORDS_TO_MATCH_TRIMMED.length; w++ ) {
						var index_of_left_word = diagonal_left_string.indexOf( WORDS_TO_MATCH_TRIMMED[ w ] );
						if ( -1 !== index_of_left_word ) {
							console.log( 'Diagonal match (reversed, down and left) for "' + WORDS_TO_MATCH[ w ] + '" on row ' + ( i + 1 + index_of_left_word ) + ' starting at letter #' + ( x + 1 - index_of_left_word ) );
							found_word( i + index_of_left_word, x - index_of_left_word, WORDS_TO_MATCH_TRIMMED[ w ], 'diagonal-left', 'yellow' );
							remove_word_from_list( w );
						}
					}

					// check for forwards words
					for ( var v = 0; v < WORDS_TO_MATCH_TRIMMED.length; v++ ) {
						var left_word_reversed = WORDS_TO_MATCH_TRIMMED[ v ].split( '' ).reverse().join( '' );
						var index_of_left_word_reversed = diagonal_left_string.indexOf( left_word_reversed );
						if ( -1 !== index_of_left_word_reversed ) {
							console.log( 'Diagonal match (down and left) for "' + WORDS_TO_MATCH[ v ] + '" on row ' + ( i + 1 + index_of_left_word_reversed ) + ' starting at letter #' + ( x + 1 - index_of_left_word_reversed ) );
							found_word( i + index_of_left_word_reversed, x - index_of_left_word_reversed, WORDS_TO_MATCH_TRIMMED[ v ], 'diagonal-left', 'yellow' );
							remove_word_from_list( v );
						}
					}
				}
			}
		}
	};

	var create_display = function() {
		var table_html = '', list_html = '';

		// set up table
		table_html += '<table><tr><th></th>';

		// set up horizontal headers
		for ( var i = 1; i <= WORD_GRID_ROWS[0].length; i++ ) {
			table_html += '<th>' + i + '</th>';
		}

		table_html += '</tr>';

		jQuery.each( WORD_GRID, function( x, row ) {
			table_html += '<tr><th>' + ( parseInt( x ) + 1 ) + '</th>';
			jQuery.each( row, function( x, letter ) {
				table_html += '<td>' + letter + '</td>';
			});
			table_html += '</tr>';
		});

		table_html += '</table>';

		jQuery( '#word_table_container' ).html( table_html );

		// table styles
		jQuery( '#word_table_container, #word_table_container th' ).css( { 'background-color': '#333', 'color': 'white' } );
		jQuery( '#word_table_container td' ).css( { 'text-align': 'center', 'color': '#777' } );

		// set up list
		list_html += '<ol>';

		for ( var y = 0; y < WORDS_TO_MATCH.length; y++ ) {
			list_html += '<li>' + WORDS_TO_MATCH[ y ] + '</li>';
		}

		list_html += '</ol>';

		jQuery( '#word_list_container' ).html( list_html );
	};
})();

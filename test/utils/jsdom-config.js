var jsdom = require( 'jsdom' );

// load the File System library from node.js
var fs = require( 'fs' );

// load the html [the path is relative to the project root dir]
var html_template = fs.readFileSync(
	"test/test.html",
	"utf-8"
);

// setup the document for our tests
var doc = jsdom.jsdom( html_template );

// get the window object out of the document
var win = doc.defaultView;

// set globals for mocha that make access to document and window feel 
// natural in the test environment
global.document = doc;
global.window = win;

// take all properties of the window object and also attach it to the 
// mocha global object
propagateToGlobal( win );

// from mocha-jsdom https://github.com/rstacruz/mocha-jsdom/blob/master/index.js#L80
function propagateToGlobal ( window ) {
	for ( key in window ) {
		if ( ! window.hasOwnProperty( key ) ) {
			continue;
		}
		if ( key in global ) {
			continue;
		}

		global[ key ] = window[ key ];
	}
}
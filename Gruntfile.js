module.exports = function( grunt ) {

	// load all tasks automagically
	require( 'load-grunt-tasks' )( grunt );

	// load timer plugin
	require( 'time-grunt' )( grunt );
	
	// all configurations
	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),
		paths: {
			js: {
				source: 'scripts/*.js',
				dest: 'public/scripts/main.js',
				files: [
					'<%= paths.js.source %>',
					'Gruntfile.js',
					'test/**/*.js',
					'!test/utils/**/*.js'
				]
			},
			sass: {
				dir: 'styles'
			},
			css: {
				dir: 'public/styles',
				dest: '<%= paths.css.dir %>/main.css'
			},
			test: {
				files: 'test/**/*.test.js'
			}
		},
		sass: {
			options: {
				style: 'expanded'
			},
			dist: {
				files: [{
					expand: true,
					cwd: '<%= paths.sass.dir %>',
					src: ['*.scss'],
					dest: '<%= paths.css.dir %>',
					ext: '.css'
				}]
			}
		},
		concat: {
			js: {
				src: '<%= paths.js.source %>',
				dest: '<%= paths.js.dest %>'
			}
		},
		jshint: {
			options: {
				curly: true,
				eqeqeq: true,
				browser: true,
				devel: true,
				undef: true,
				unused: false,
				mocha: true,
				globals: {
					'jQuery': true,
					'module': true,
					'require': true,
					'window': true,
					'global': true
				}
			},
			dist: '<%= paths.js.files %>'
		},
		mochaTest: {
			test: {
				options: {
					reporter: 'nyan',
					require: 'test/utils/jsdom-config.js'
				},
				src: '<%= paths.test.files %>'
			}
		},
		watch: {
			jshint: {
				files: '<%= paths.js.files %>',
				tasks: ['jshint', 'concat'],
				options: {
					spawn: false
				}
			},
			sass: {
				files: '<%= paths.sass.dir %>',
				tasks: ['sass'],
				options: {
					spawn: false
				}
			},
			mocha: {
				files: [
					'<%= paths.test.files %>',
					'<%= paths.js.source %>'
				],
				tasks: ['mochaTest']
			}
		},
		concurrent: {
			options: {
					logConcurrentOutput: true
			},
			dev: {
				tasks: [
					'watch:jshint',
					'watch:sass',
					'watch:mocha'
				]
			}
		}
	});

	/* Custom Tasks */
	
	// building and deployment
	grunt.registerTask( 'build', ['jshint', 'sass', 'mochaTest', 'concat'] );

	// automated checks
	grunt.registerTask( 'dev', 'concurrent:dev' );

	// default task (made it the same as the "build" task)
	grunt.registerTask( 'default', 'build' );
};

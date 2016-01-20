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
				dir: 'styles',
				files: '<%= paths.sass.dir %>/**/*.scss'
			},
			css: {
				dir: 'public/styles',
				dest: '<%= paths.css.dir %>/main.css'
			},
			test: {
				files: 'test/**/*.test.js'
			},
			host: {
				dir: '../foresthoffman.github.io/<%= pkg.name %>/'
			},
			source: {
				dir: 'public/'
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
					src: ['**/*.scss'],
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
					reporter: 'spec',
					require: 'test/utils/jsdom-config.js'
				},
				src: '<%= paths.test.files %>'
			}
		},
		exec: {
			zip: {
				cmd: function () {
					var pkg_name = grunt.template.process( '<%= pkg.name %>' );
					var host_dir_path = grunt.template.process( '<%= paths.host.dir %>' );
					var source_dir_path = grunt.template.process( '<%= paths.source.dir %>' );
					var version = grunt.template.process( '<%= pkg.version %>' );
					var dest = '../zips/' + pkg_name + '/' + pkg_name + '-' + version + '.zip';

					var zip_command = 'zip -r --exclude=*.DS_Store* ' + dest + ' ' + source_dir_path;

					return zip_command;
				}
			},
			copy: {
				cmd: function () {
					var host_dir_path = grunt.template.process( '<%= paths.host.dir %>' );
					var source_dir_path = grunt.template.process( '<%= paths.source.dir %>' );

					var copy_command = 'cp -r ' + source_dir_path + ' ' + host_dir_path;

					return copy_command;
				}
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
				files: '<%= paths.sass.files %>',
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
	grunt.registerTask( 'build', ['jshint', 'sass', 'mochaTest', 'concat', 'exec:zip'] );
	grunt.registerTask( 'deploy', ['build', 'exec:copy'] );

	// automated checks
	grunt.registerTask( 'dev', 'concurrent:dev' );

	// default task (made it the same as the "build" task)
	grunt.registerTask( 'default', 'build' );
};

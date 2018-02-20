'use strict';
const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const gulpSequence = require('gulp-sequence');
const exec = require('child_process').exec;

var dev = process.argv.indexOf('--dist') < 0;

// -----------------------------------------------------------------------------
// Task: Polymer CLI - use the Polymer CLI for bundling and JS minification
//   See polymer.json for Polymer CLI build options.
// -----------------------------------------------------------------------------
gulp.task('polymer:cli', function (cb) {
  exec('node ./node_modules/polymer-cli/bin/polymer.js build', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

// -----------------------------------------------------------------------------
// getTask() loads external gulp task script functions by filename
// -----------------------------------------------------------------------------
function getTask(task) {
	return require('./tasks/' + task)(gulp, plugins);
}

// -----------------------------------------------------------------------------
// Task: Compile : Scripts, Sass, EJS, All
// -----------------------------------------------------------------------------
gulp.task('compile:sass', getTask('compile.sass'));
gulp.task('compile:index', ['compile:sass'], getTask('compile.index'));

// -----------------------------------------------------------------------------
// Task: Serve : Start
// -----------------------------------------------------------------------------
gulp.task('serve:dev:start', getTask('serve.dev.start'));
gulp.task('serve:dist:start', ['dist'], getTask('serve.dist.start'));

// -----------------------------------------------------------------------------
// Task: Watch : Source, Public, All
// -----------------------------------------------------------------------------
gulp.task('watch:public', getTask('watch.public'));

// -----------------------------------------------------------------------------
// Task: Dist (Build app ready for deployment)
// 	clean, compile:sass, compile:index, bundle (using polymer cli), copy
// -----------------------------------------------------------------------------
gulp.task('dist', function(cb) {
	gulpSequence(
		'dist:clean', 
		'compile:index', 
		'polymer:cli',
		'dist:copy'
	)(cb);
});

// -----------------------------------------------------------------------------
// Task: Dist : Copy extra files for deployment, that weren't bundled.
// -----------------------------------------------------------------------------
gulp.task('dist:copy', getTask('dist.copy'));

// -----------------------------------------------------------------------------
// Task: Dist : Clean 'dist/'' folder
// -----------------------------------------------------------------------------
gulp.task('dist:clean', getTask('dist.clean'));

// -----------------------------------------------------------------------------
//  Task: Default (compile source, start server, watch for changes)
//    run "gulp --dist" to serve up files from the build directory.
// -----------------------------------------------------------------------------
gulp.task('default', function (cb) {
	if (dev) {
		gulpSequence('compile:index', 'watch:public', 'serve:dev:start')(cb);
	} else {
		gulpSequence('serve:dist:start')(cb);
	}	
});

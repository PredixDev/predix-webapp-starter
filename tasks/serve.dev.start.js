'use strict';

// -------------------------------------
//   Task: Serve raw unbundled files from /public
// -------------------------------------
const nodemon = require('gulp-nodemon');

module.exports = function() {
  return function() {
    nodemon({
        script: 'server/app.js',
        ignore: ['/../public/*'],
        env: { 'base-dir' : '/../public'}
      })
      .on('restart', function() {
        console.log('app.js restarted');
      });
  };
};

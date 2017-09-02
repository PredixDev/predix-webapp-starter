'use strict';
const clean = require('gulp-clean');

// ---------------------------
//   Task: Clean 'build' folder
// ---------------------------

module.exports = function(gulp) {
  return function() {
    return gulp.src('build', {read: false})
      .pipe(clean());
  };
};

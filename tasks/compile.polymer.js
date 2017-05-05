'use strict';

// -------------------------------------------
//   Task: Compile: Bundle polymer elements.
//    also minify HTML, CSS, JS using htmlmin
// -------------------------------------------

const htmlmin = require('gulp-htmlmin');
const PolymerProject = require('polymer-build').PolymerProject;
const filter = require('gulp-filter');
const project = new PolymerProject(require('../polymer.json'));

module.exports = function(gulp) {
  return function() {

    const mergeStream = require('merge-stream');

    // Create a build pipeline to pipe both streams together to the 'build/' dir
    return mergeStream(project.sources(), project.dependencies())
      .pipe(project.bundler())
      // polymer build will copy over all the bower components. we'll filter them out here.
      //  then add back a few that we need in the dist.copy task.
      .pipe(filter(['**', '!**/bower_components/**',]))

      .pipe(htmlmin({
          removeEmptyAttributes: true,
          customAttrAssign: [{"source":"\\$="}],
          customAttrSurround: [
              [ {"source": "\\({\\{"}, {"source": "\\}\\}"} ],
              [ {"source": "\\[\\["}, {"source": "\\]\\]"}  ]
          ],
          collapseWhitespace: true,
          // always leave one space
          // because http://perfectionkills.com/experimenting-with-html-minifier/#collapse_whitespace
          conservativeCollapse: true,
          maxLineLength: 10000,
          // minifyJS: true,  // disabled for now, since it was causing errors along with gzip compression.
          minifyCSS: true,
          removeComments: true,
          removeCommentsFromCDATA: true,
          removeCDATASectionsFromCDATA: true
      }))

      .pipe(gulp.dest('dist/'));
  };
};

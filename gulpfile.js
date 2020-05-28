var gulp = require('gulp');
var csso = require('gulp-csso');
var minify = require('gulp-minify');
var concat = require('gulp-concat');
var del = require('del');
var htmlmin = require('gulp-htmlmin');
var rev = require('gulp-rev');
var revRewrite = require('gulp-rev-rewrite');
var revDel = require('rev-del');
var sass = require('gulp-sass');
sass.compiler = require('node-sass');

/**
 * List of CSS and JS files to be merged and minified
 */
var vendorCssFiles = [
  'node_modules/bootstrap/dist/css/bootstrap.min.css',
  'node_modules/@fortawesome/fontawesome-free/css/all.min.css',
  'node_modules/@fortawesome/fontawesome-free/css/v4-shims.min.css',
  'node_modules/animate.css/animate.min.css',
  'node_modules/bootstrap-select/dist/css/bootstrap-select.min.css',
  'node_modules/glider-js/glider.min.css'
];

var vendorJsFiles = [
  'node_modules/jquery/dist/jquery.min.js',
  'node_modules/jquery.easing/jquery.easing.min.js',
  'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
  'node_modules/wowjs/dist/wow.min.js',
  'node_modules/bootstrap-select/dist/js/bootstrap-select.min.js',
  'node_modules/moment/min/moment.min.js',
  'node_modules/moment-timezone/builds/moment-timezone-with-data-1970-2030.min.js',
  'node_modules/glider-js/glider.min.js'
];

var myCssFiles = ['src/scss/*.scss'];

var myJsFiles = [
  'src/js/timezone.js',
  'src/js/service.js',
  'src/js/video.js',
  'src/js/gallery.js',
  'src/js/main.js'
];

/**
 * Remove all build files
 */
gulp.task('cleanBuild', function () {
  return del(['dist/css', 'dist/js']);
});

/**
 * CSS minification and concatination tasks
 */

gulp.task('concatVendorCssFiles', function () {
  return gulp.src(vendorCssFiles)
    .pipe(concat('vendor.min.css'))
    .pipe(gulp.dest('dist/css/'));
});

gulp.task('concatMyCss:dev', function () {
  return gulp.src(myCssFiles)
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('app.css'))
    .pipe(gulp.dest('dist/css/'));
});

gulp.task('minifyMyCss', function () {
  return gulp.src(myCssFiles)
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('app.min.css'))
    .pipe(csso())
    .pipe(gulp.dest('dist/css/'));
});

gulp.task('concatCss', function () {
  return gulp.src(['dist/css/vendor.min.css', 'dist/css/*.css'])
    .pipe(concat('bundle.min.css'))
    .pipe(gulp.dest('dist/css/'));
});

/**
 * JS minification and concatination tasks
 */
gulp.task('concatVendorJsFiles', function () {
  return gulp.src(vendorJsFiles)
    .pipe(concat('vendor.min.js'))
    .pipe(gulp.dest('dist/js/'));
});

gulp.task('concatMyJs:dev', function () {
  return gulp.src(myJsFiles)
    .pipe(concat('app.js'))
    .pipe(gulp.dest('dist/js/'));
});

gulp.task('minifyMyJs', function () {
  return gulp.src(myJsFiles)
    .pipe(concat('app.js'))
    .pipe(minify({
      ext: {
        min: '.min.js'
      }
    }))
    .pipe(gulp.dest('dist/js/'));
});

gulp.task("delMyJs:prod", function () {
  return del('dist/js/app.js');
});

gulp.task('concatJs', function () {
  return gulp.src(['dist/js/vendor.min.js', 'dist/js/*.js'])
    .pipe(concat('bundle.min.js'))
    .pipe(gulp.dest('dist/js/'));
});

/**
 * Version CSS and JS file imports & Minify HTML
 */
// Step 1
gulp.task('revision', function () {
  return gulp.src('dist/**/*.{css,js}')
    .pipe(rev())
    .pipe(gulp.dest('dist'))
    .pipe(rev.manifest({ merge: false }))
    .pipe(revDel({ dest: 'dist' }))
    .pipe(gulp.dest('dist'));
});

// Step 2
gulp.task('rewrite', function () {
  const manifest = gulp.src('dist/rev-manifest.json');

  return gulp.src('src/*.html')
    .pipe(revRewrite({ manifest }))
    .pipe(htmlmin({
      collapseWhitespace: true,
      caseSensitive: true,
      removeComments: true
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('minifyHTML:dev', function () {
  return gulp.src('src/*.html')
    .pipe(htmlmin({
      collapseWhitespace: true,
      caseSensitive: true,
      removeComments: true
    }))
    .pipe(gulp.dest('./'));
})

gulp.task("versioning", gulp.series('revision', 'rewrite'));

/**
 * one time copy tasks
 */
gulp.task('copy-fa', function () {
  return gulp.src('node_modules/@fortawesome/fontawesome-free/webfonts/*')
    .pipe(gulp.dest('dist/webfonts/'));
});

gulp.task('oneTime', gulp.parallel('copy-fa'));

/**
 * Prod build flow
 */

gulp.task('build:prod', gulp.series(
  gulp.parallel('cleanBuild'),
  gulp.parallel('concatVendorCssFiles', 'minifyMyCss', 'concatVendorJsFiles', 'minifyMyJs'),
  'delMyJs:prod',
  gulp.parallel('concatCss', 'concatJs'),
  'versioning'
));

/**
 * Dev build flow - no minification and versioning
 */

gulp.task('build:dev', gulp.series(
  gulp.parallel('cleanBuild'),
  gulp.parallel('concatVendorCssFiles', 'concatMyCss:dev', 'concatVendorJsFiles', 'concatMyJs:dev'),
  gulp.parallel('concatCss', 'concatJs'),
  'minifyHTML:dev'
));

/**
 * watch files and build automatically - dev only
 */

exports.watch = function () {
  gulp.watch(['src/scss/*.scss', 'src/js/*.js'], gulp.series('build:dev'));
  gulp.watch(['src/*.html'], gulp.series('minifyHTML:dev'));
}

/**
 * default task
 */
exports.default = gulp.series(gulp.parallel('oneTime', 'build:prod'));
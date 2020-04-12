var gulp = require('gulp');
var csso = require('gulp-csso');
var concat = require('gulp-concat');
var del = require('del');

/**
 * CSS minification and concatination tasks
 */

var vendorCssLibs = [
  'node_modules/bootstrap/dist/css/bootstrap.min.css',
  'node_modules/@fortawesome/fontawesome-free/css/all.min.css',
  'node_modules/@fortawesome/fontawesome-free/css/v4-shims.min.css',
  'node_modules/animate.css/animate.min.css',
  'node_modules/bootstrap-select/dist/css/bootstrap-select.min.css'
];

var myCssFiles = ['src/css/*.css'];

gulp.task('cleanCss', function () {
  return del('dist/css');
});

gulp.task('concatVendorCssLibs', function () {
  return gulp.src(vendorCssLibs)
    .pipe(concat('vendor.min.css'))
    .pipe(gulp.dest('dist/css/'));
});

gulp.task('minifyMyCss', function () {
  return gulp.src(myCssFiles)
    .pipe(csso())
    .pipe(concat('my.min.css'))
    .pipe(gulp.dest('dist/css/'));
});

gulp.task('concatCss', function () {
  return gulp.src(['dist/css/vendor.min.css', 'dist/css/my.min.css'])
    .pipe(concat('app.min.css'))
    .pipe(gulp.dest('dist/css/'));
});

gulp.task('buildCss', gulp.series('cleanCss', gulp.parallel('concatVendorCssLibs', 'minifyMyCss'), 'concatCss'));

/**
 * JS minification and concatination tasks
 */
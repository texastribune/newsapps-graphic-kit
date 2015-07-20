/* global -$ */
'use strict';

var fs = require('fs');

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');

var reload = browserSync.reload;
var stream = browserSync.stream;

gulp.task('jshint', function() {
  return gulp.src(['app/scripts/**/*.js', '!app/scripts/libs/*'])
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

gulp.task('styles', function() {
  return gulp.src('app/**/*.scss')
    .pipe($.sass({
      precision: 10,
      onError: console.error.bind(console, 'Sass error: ')
    }))
    .pipe($.autoprefixer(['last 2 versions', 'IE 9', 'IE 8']))
    .pipe(gulp.dest('.tmp'))
    .pipe(stream({match: '**/*.css'}))
    .pipe($.if('*.css', $.csso()))
    .pipe($.gzip({append: false}))
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'styles'}));
});

gulp.task('templates', function() {
  var nunjucks = require('nunjucks');
  var map = require('vinyl-map');

  var data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

  // pulls over the bucket and slug data for the preview page
  var packageData = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  data.INTERNAL = packageData.config;

  // disable watching or it'll hang forever
  nunjucks.configure('app', {watch: false});

  var nunjuckified = map(function(code, filename) {
    return nunjucks.renderString(code.toString(), data);
  });

  return gulp.src(['app/**/{*,!_*}.html', '!app/**/_*.html'])
    .pipe(nunjuckified)
    .pipe(gulp.dest('.tmp'))
    .pipe($.size({title: 'html'}));
});

gulp.task('images', function() {
  return gulp.src('app/assets/images/**/*')
  .pipe($.cache($.imagemin({
    progressive: true,
    interlaced: true
  })))
  .pipe(gulp.dest('dist/assets/images'))
  .pipe($.size({title: 'images'}));
});

gulp.task('assets', function() {
  return gulp.src(['app/assets/*', '!app/assets/images/'])
  .pipe(gulp.dest('dist/assets'))
  .pipe($.size({title: 'assets'}));
});

gulp.task('html', ['templates'], function() {
  var assets = $.useref.assets({searchPath: ['.tmp', 'app', '.']});

  return gulp.src('.tmp/index.html')
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.csso()))
    .pipe($.rev())
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.revReplace())
    .pipe($.gzip({append: false}))
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'html'}));
});

gulp.task('clean', function(cb) {
  return del(['.tmp/**', 'dist/**', '!dist/.git'], {dot: true}, cb);
});

gulp.task('pym', function() {
  return gulp.src('node_modules/pym.js/dist/pym.min.js')
    .pipe($.gzip({append: false}))
    .pipe(gulp.dest('dist/scripts/pym/'));
});

gulp.task('serve', ['styles', 'templates'], function() {
  browserSync({
    notify: false,
    logPrefix: 'NEWSAPPS',
    open: false,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  });

  gulp.watch(['app/**/*.html'], ['templates', reload]);
  gulp.watch(['data.json'], ['templates', reload]);
  gulp.watch(['app/styles/**/*.scss'], ['styles']);
  gulp.watch(['app/scripts/**/*.js'], ['jshint', reload]);
  gulp.watch(['app/images/**/*'], reload);
  gulp.watch(['app/fonts/**/*'], reload);
});

gulp.task('serve:build', ['default'], function() {
  browserSync({
    notify: false,
    logPrefix: 'NEWSAPPS',
    open: true,
    server: ['dist']
  });
});

gulp.task('default', ['clean'], function(cb) {
  runSequence('styles', ['jshint', 'html', 'images', 'assets', 'pym'], cb);
});

gulp.task('build', ['default']);

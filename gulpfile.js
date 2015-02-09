/* global -$ */
'use strict';

var fs = require('fs');

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({
  rename: {
    'gulp-ruby-sass': 'sass',
    'gulp-nunjucks-render': 'nunjucks'
  }
});
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');

var reload = browserSync.reload;

gulp.task('jshint', function() {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

gulp.task('styles', function() {
  return $.sass('app/styles/', {
      loadPath: ['.'],
      precision: 10,
      sourcemap: true
    })
    .on('error', console.error.bind(console))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'IE 9', 'IE 8'],
      cascade: false
    }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.size({title: 'styles'}));
});

gulp.task('templates', function() {
  var data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  var packageData = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  // pulls over the bucket and slug data for the preview page
  data.INTERNAL = packageData.config;

  $.nunjucks.nunjucks.configure(['app/']);

  return gulp.src(['app/**/*.html', '!app/includes/*'])
    .pipe($.nunjucks(data))
    .pipe(gulp.dest('.tmp'));
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

gulp.task('clean', function() {
  del(['.tmp', 'dist/*', '!dist/.git'], {dot: true});
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
  gulp.watch(['app/styles/**/*.scss'], ['styles', reload]);
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

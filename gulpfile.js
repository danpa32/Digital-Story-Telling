const gulp = require('gulp');
const sass = require('gulp-sass');
const browserSync = require('browser-sync').create();
const header = require('gulp-header');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const pkg = require('./package.json');

// Set the banner content
const banner = ['/*!\n',
  ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
  ` * Copyright 2013-${(new Date()).getFullYear()} <%= pkg.author %>\n`,
  ' * Licensed under <%= pkg.license %> (https://github.com/BlackrockDigital/<%= pkg.name %>/blob/master/LICENSE)\n',
  ' */\n',
  '',
].join('');

// Compiles SCSS files from /scss into /css
gulp.task('sass', () => {
  return gulp.src('src/scss/*.scss')
    .pipe(sass())
    .pipe(header(banner, {
      pkg,
    }))
    .pipe(gulp.dest('src/css'))
    .pipe(browserSync.reload({
      stream: true,
    }));
});

// Minify compiled CSS
gulp.task('minify-css', ['sass'], () => {
  return gulp.src(['src/css/*.css', '!src/css/*.min.css'])
    .pipe(cleanCSS({
      compatibility: 'ie8',
    }))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(gulp.dest('src/css'))
    .pipe(browserSync.reload({
      stream: true,
    }));
});

// Minify custom JS
gulp.task('minify-js', () => {
  // return gulp.src('src/js/grayscale.js')
  //   .pipe(uglify())
  //   .pipe(header(banner, {
  //     pkg,
  //   }))
  //   .pipe(rename({
  //     suffix: '.min',
  //   }))
  //   .pipe(gulp.dest('src/js'))
  //   .pipe(browserSync.reload({
  //     stream: true,
  //   }));
});

// Copy vendor files from /node_modules into /vendor
// NOTE: requires `npm install` before running!
gulp.task('copy', () => {
  gulp.src([
    'node_modules/bootstrap/dist/**/*',
    '!**/npm.js',
    '!**/bootstrap-theme.*',
    '!**/*.map',
  ])
    .pipe(gulp.dest('src/vendor/bootstrap'));

  gulp.src(['node_modules/jquery/dist/jquery.js', 'node_modules/jquery/dist/jquery.min.js'])
    .pipe(gulp.dest('src/vendor/jquery'));

  gulp.src(['node_modules/jquery.easing/*.js'])
    .pipe(gulp.dest('src/vendor/jquery-easing'));

  gulp.src([
    'node_modules/font-awesome/**',
    '!node_modules/font-awesome/**/*.map',
    '!node_modules/font-awesome/.npmignore',
    '!node_modules/font-awesome/*.txt',
    '!node_modules/font-awesome/*.md',
    '!node_modules/font-awesome/*.json',
  ])
    .pipe(gulp.dest('src/vendor/font-awesome'));

  gulp.src(['node_modules/d3/build/*.js'])
    .pipe(gulp.dest('src/vendor/d3'));

  gulp.src(['node_modules/d3-geo/build/*.js'])
    .pipe(gulp.dest('src/vendor/d3-geo'));

  gulp.src(['node_modules/d3-queue/build/*.js'])
    .pipe(gulp.dest('src/vendor/d3-queue'));

  gulp.src(['node_modules/topojson/dist/*.js'])
    .pipe(gulp.dest('src/vendor/topojson'));
});

// Default task
gulp.task('default', ['sass', 'minify-css', 'minify-js', 'copy']);

// Configure the browserSync task
gulp.task('browserSync', () => {
  browserSync.init({
    server: {
      baseDir: 'src',
    },
  });
});

// Dev task with browserSync
gulp.task('dev', ['browserSync', 'sass', 'minify-css', 'minify-js'], () => {
  gulp.watch('src/scss/*.scss', ['sass']);
  gulp.watch('src/css/*.css', ['minify-css']);
  gulp.watch('src/js/*.js', ['minify-js']);
  // Reloads the browser whenever HTML or JS files change
  gulp.watch('src/*.html', browserSync.reload);
  gulp.watch('src/js/**/*.js', browserSync.reload);
});

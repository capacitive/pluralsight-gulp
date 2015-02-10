var gulp = require('gulp');
var less = require('gulp-less');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var nodemon = require('gulp-nodemon');

var browserSync = require('browser-sync');
var reload = browserSync.reload;


/**
 * Run nodemon and watch for changes
 */
gulp.task('nodemon', function () {
    return nodemon({
        script: './src/server/app.js',
        env: { 'NODE_ENV': 'dev', 'PORT': 7203 },
        watch: ['src/server/**/*.js']
    })
    .on('restart', function (ev) {
        console.log('Restarting nodemon ...');
        console.log('Changed files:\n' + ev);
    });
});


/**
 * Run browser sync
 */
gulp.task('browser-sync', ['nodemon'], function () {
    if (browserSync.active) {
        return;
    }

    browserSync({
        proxy: 'localhost:7203',
        browser: 'chrome',
        injectChanges: true,
        files: ['./src/client/**/*.html', './src/client/**/*.js', './.tmp/styles.css']
    });
});

/**
 * Lint all js files with JSHint and JSCS
 */
gulp.task('lint', function () {
    return gulp.src(['./src/**/*.js', '*.js'])
//        .pipe(jscs())
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish', {verbose: true}));
});


/**
 * Compile LESS to CSS
 */
gulp.task('less', function () {
    return gulp.src('./src/client/styles/**/*.less')
        .pipe(less())
        .pipe(gulp.dest('./.tmp/'));
});


/**
 * Default task
 */
gulp.task('default', ['less', 'browser-sync'], function () {
    gulp.watch(['./src/**/*.js', '*.js'], ['lint']);
    gulp.watch(['./src/client/styles/**/*.less'], ['less']);
});

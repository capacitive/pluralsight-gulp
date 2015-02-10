var gulp = require('gulp');
var less = require('gulp-less');
var jscs = require('gulp-jscs');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var inject = require('gulp-inject');
var useref = require('gulp-useref');
var nodemon = require('gulp-nodemon');
var minifyCss = require('gulp-minify-css');
var minifyHtml = require('gulp-minify-html');
var templateCache = require('gulp-angular-templatecache');

var wiredep = require('wiredep').stream;

var del = require('del');

var browserSync = require('browser-sync');
var reload = browserSync.reload;


/**
 * Remove temporary and production folders
 */
gulp.task('clean', function (done) {
	del(['./.tmp', './dist'], done);
});


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
		.pipe(jscs())
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish', {verbose: true}));
});


/**
 * Inject js and css files into index.html
 */
gulp.task('inject', ['less'], function () {
	return gulp.src('./src/client/index.html')
		.pipe(inject(gulp.src(['./src/client/app/**/*.js', './src/client/app/**/*.module.js', '!./src/client/app/**/*.spec.js']), {read: false}))
		.pipe(inject(gulp.src(['./.tmp/**/*.css']), {read: false}))
		.pipe(gulp.dest('./src/client'));
});


/**
 * Inject bower js and css files into index.html
 */
gulp.task('wiredep', function () {
	return gulp.src('./src/client/index.html')
	.pipe(wiredep({ignorePath: '../..', json: require('./bower.json'), directory: './bower_components/'}))
		.pipe(gulp.dest('./src/client'));
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
 * Cache all angular templates
 */
gulp.task('template-cache', function () {
	return gulp.src('./src/client/app/**/*.html')
		.pipe(minifyHtml({empty: true}))
		.pipe(templateCache())
		.pipe(gulp.dest('./.tmp/'));
});


/**
 * Optimize css and js files
 */
gulp.task('optimize', ['wiredep', 'inject'], function () {
	var assets = useref.assets({searchPath: './'});

	return gulp.src('./src/client/index.html')
		.pipe(inject(gulp.src('./.tmp/templates.js'), {read: false}), {starttag: '<!-- inject:templates:js -->'})
		.pipe(assets)
		.pipe(gulpif('*.js', uglify()))
		.pipe(gulpif('*.css', minifyCss()))
		.pipe(assets.restore())
		.pipe(useref())
		.pipe(gulp.dest('./dist'));
});


/**
 * Default task
 */
gulp.task('default', ['inject', 'wiredep', 'browser-sync'], function () {
	gulp.watch(['./src/client/styles/**/*.less'], ['less']);
});

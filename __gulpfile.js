var gulp = require('gulp');
var less = require('gulp-less');
var jscs = require('gulp-jscs');
var bump = require('gulp-bump');
var print = require('gulp-print');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var inject = require('gulp-inject');
var useref = require('gulp-useref');
var nodemon = require('gulp-nodemon');
var plumber = require('gulp-plumber');
var minifyCss = require('gulp-minify-css');
var minifyHtml = require('gulp-minify-html');
var autoprefixer = require('gulp-autoprefixer');
var templateCache = require('gulp-angular-templatecache');

var args = require('yargs').argv;
var wiredep = require('wiredep').stream;
var karma = require('karma').server;

var del = require('del');

var browserSync = require('browser-sync');
var reload = browserSync.reload;


/**
 * Remove temporary and production folders
 */
gulp.task('clean', function (done) {
    del(['./.tmp', './dist', './report'], done);
});


/**
 * Bump project version
 * Usage: gulp bump --type major|minor|patch or gulp bump for default 'patch' type
 */
gulp.task('bump', function () {
    return gulp.src(['./package.json', './bower.json'])
        .pipe(print())
        .pipe(bump({type: args.type || 'patch'}))
        .pipe(gulp.dest('./'));
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
gulp.task('browser-sync', ['nodemon', 'inject'], function () {
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
 * Compile LESS to CSS
 */
gulp.task('less', function () {
    return gulp.src('./src/client/styles/**/*.less')
    .pipe(plumber())
    .pipe(less())
    .pipe(autoprefixer({browsers: ['last 2 version', '> 5%']}))
    .pipe(gulp.dest('./.tmp/'));
});


/**
 * Inject bower js and css files into index.html
 */
gulp.task('wiredep', function () {
    return gulp.src('./src/client/index.html')
    .pipe(wiredep({ignorePath: '../..', json: require('./bower.json'), directory: './bower_components/'}))
    .pipe(inject(gulp.src(['./src/client/app/**/*.module.js', './src/client/app/**/*.js', '!./src/client/app/**/*.spec.js']), {read: false}))
    .pipe(gulp.dest('./src/client'));
});


/**
 * Inject js and css files into index.html
 */
gulp.task('inject', ['wiredep', 'less'], function () {
    return gulp.src('./src/client/index.html')
        .pipe(inject(gulp.src(['./.tmp/**/*.css']), {read: false}))
        .pipe(gulp.dest('./src/client'));
});


/**
 * Cache all angular templates
 */
gulp.task('template-cache', function () {
    var options = {
        file: 'templates.js',
        options: {
            module: 'app.core',
            standalone: false,
            root: 'app/'
        }
    };

    return gulp.src('./src/client/app/**/*.html')
        .pipe(minifyHtml({empty: true}))
        .pipe(templateCache(options.file, options.options))
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
 * Run tests
 */
gulp.task('test', ['template-cache'], function (done) {
    karma.start({
        configFile: __dirname + '/karma.conf.js',
        exclude: ['./src/client/tests/server-integration/**/*.spec.js'],
        singleRun: false
    }, done);
});


/**
 * Default task
 */
gulp.task('default', ['browser-sync', 'test'], function () {
    gulp.watch(['./src/client/styles/**/*.less'], ['less']);
});

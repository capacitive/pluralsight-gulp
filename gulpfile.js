var gulp = require('gulp');
var args = require('yargs').argv;
var config = require('./gulp.config')();
var del = require('del');
var wiredep = require('wiredep').stream;
var $ = require('gulp-load-plugins')({lazy: true});

gulp.task('lint', function () {
    log('Analyzing sources with JSHint and JSCS');

    return gulp
      .src(config.alljs)
      .pipe($.if(args.verbose, $.print()))
      .pipe($.jscs())
      .pipe($.jshint())
      .pipe($.jshint.reporter('jshint-stylish', {verbose: true}));
});

gulp.task('less',['clean'],  function () {
    log('Compiling Less --> CSS');

    return gulp
      .src(config.less)
      .pipe($.plumber())
      .pipe($.less())
      .pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
      .pipe(gulp.dest(config.tmp));
});

gulp.task('clean', function (done) {
    var files = config.tmp + '**/*.css';
    clean(files, done);
});

gulp.task('watch', function () {
    gulp.watch([config.less], ['less']);
});

gulp.task('wiredep', function () {
    var options = config.getWiredepOptions();

    return gulp
      .src(config.index)
      .pipe(wiredep(options))
      .pipe($.inject(gulp.src(config.js)))
      .pipe(gulp.dest(config.client));
});

function log(message) {
    if (typeof(message) === 'object') {
        for (var item in message) {
            if (message.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(message[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(message));
    }
}

function clean (files, done) {
    log('Cleaning ' + $.util.colors.yellow(files));
    del(files, done);
}

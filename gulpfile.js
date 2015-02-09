var gulp = require('gulp');
var args = require('yargs').argv;
var config = require('./gulp.config')();
var del = require('del');
var wiredep = require('wiredep').stream;
var $ = require('gulp-load-plugins')({lazy: true});

gulp.task('lint', function () {
    'use strict';

    log('Analyzing sources with JSHint and JSCS');

    return gulp
        .src(config.alljs)
        .pipe($.if(args.verbose, $.print()))
        .pipe($.jscs())
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', {verbose: true}));
});

gulp.task('less', ['clean'],  function () {
    'use strict';

    log('Compiling Less --> CSS');

    return gulp
        .src(config.less)
        .pipe($.plumber())
        .pipe($.less())
        .pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
        .pipe(gulp.dest(config.tmp));
});

gulp.task('clean', function (done) {
    'use strict';

    var files = config.tmp + '**/*.css';
    clean(files, done);
});

gulp.task('watch', function () {
    'use strict';
    gulp.watch([config.less], ['less']);
});

gulp.task('wiredep', function () {
    'use strict';

    var options = config.getWiredepOptions();

    return gulp
        .src(config.index)
        .pipe(wiredep(options))
        .pipe($.inject(gulp.src(config.js)))
        .pipe(gulp.dest(config.client));
});

gulp.task('inject', ['wiredep', 'less'], function () {
    'use strict';

    return gulp
        .src(config.index)
        .pipe($.inject(gulp.src(config.css)))
        .pipe(gulp.dest(config.client));
});

function log(message) {
    'use strict';

    var item;

    if (typeof (message) === 'object') {
        for (item in message) {
            if (message.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(message[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(message));
    }
}

function clean(files, done) {
    'use strict';

    log('Cleaning ' + $.util.colors.yellow(files));
    del(files, done);
}

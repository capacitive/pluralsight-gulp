var gulp = require('gulp');
var args = require('yargs').argv;
var config = require('./gulp.config')();
var del = require('del');
var browserSync = require('browser-sync');
var wiredep = require('wiredep').stream;
var $ = require('gulp-load-plugins')({lazy: true});

var port = process.env.PORT || config.defaultPort;

gulp.task('help', $.taskListing);
gulp.task('default', ['help']);

gulp.task('fonts', ['clean-fonts'], function () {
	log('Copying fonts');

	return gulp
		.src(config.fonts)
		.pipe(gulp.dest(config.build + 'fonts'));
});

gulp.task('images', ['clean-images'], function () {
	log('Copying and compressing images');

	return gulp
		.src(config.images)
		.pipe($.imagemin({ optimizationLevel: 4 }))
		.pipe(gulp.dest(config.build + 'images'));
});

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

gulp.task('less', ['clean-styles'],  function () {
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

	var files = [].concat(config.build, config.tmp);
	log('Cleaning: ' + $.util.colors.yellow(files));

	del(files, done);
});

gulp.task('clean-code', function (done) {
	var files = [].concat(
		config.tmp + '**/*.js',
		config.build + '**/*.html',
		config.build + 'js/**/*.js'
	);
	clean(files, done);
});

gulp.task('clean-styles', function (done) {
	'use strict';
	clean(config.tmp + '**/*.css', done);
});

gulp.task('clean-fonts', function (done) {
	'use strict';
	clean(config.build + 'fonts/**/*.*', done);
});

gulp.task('clean-images', function (done) {
	'use strict';
	clean(config.build + 'images/**/*.*', done);
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

gulp.task('serve-dev', ['inject'], function () {
	'use strict';
	serve(true);
});

gulp.task('serve-build', ['optimize'], function () {
	'use strict';
	serve(false);
});

gulp.task('templatecache', ['clean-code'], function () {
	log('Creating AngularJS $templateCache');

	return gulp
		.src(config.htmltemplates)
		.pipe($.minifyHtml({ empty: true }))
		.pipe($.angularTemplatecache(config.templateCache.file, config.templateCache.options))
		.pipe(gulp.dest(config.tmp));
});

gulp.task('optimize', ['inject', 'templatecache'], function () {
	var templateCache = config.tmp + 'templates.js';
	var assets = $.useref.assets({searchPath: './'});

	return gulp
		.src(config.index)
		.pipe($.plumber())
		.pipe($.inject(gulp.src(templateCache), {read: false}), {starttag: '<!-- inject:templates:js -->'})
		.pipe(assets)
		.pipe(assets.restore())
		.pipe($.useref())
		.pipe(gulp.dest(config.build));
});

function serve (isDev) {
	var options = {
		script: config.nodeServer,
		delayTime: 1,
		env: {
			'PORT': port,
			'NODE_ENV': isDev ? 'dev' : 'build'
		},
		watch: [config.server]
	};

	return $.nodemon(options)
	.on('restart', function (ev) {
		log('*** server restarted\n   File changed on restart:\n' + ev);
		setTimeout(function () {
			browserSync.notify('reloading now ...');
			browserSync.reload({stream: false});
		}, config.browserReloadDelay);
	})
	.on('start', function () {
		log('*** server started');
		startBrowserSync(isDev);
	})
	.on('crash', function () {
		log('*** server crashed');
	})
	.on('exit', function () {
		log('*** server exited');
	});
}

function startBrowserSync (isDev) {
	if (browserSync.active) {
		return;
	}

	if (isDev) {
		gulp.watch([config.less], ['less']);
	} else {
		gulp.watch([config.less, config.js, config.html], ['optimize', browserSync.reload]);
	}

	var options = {
		proxy: 'localhost:' + port,
		port: 3000,
		files: isDev ? [config.client + '**/*.*', config.css, '!' + config.less] : [],
		ghostMode: {
			clicks: true,
			location: false,
			forms: true,
			scrolls: true
		},
		injectChanges: true,
		logFileChanges: true,
		logLevel: 'debug',
		logPrefix: 'gulp-patterns',
		notify: true,
		reloadDelay: 1000
	};

	log('starting browser-sync on port ' + port);
	browserSync(options);
}

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

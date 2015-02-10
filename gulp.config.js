module.exports = function () {
    'use strict';

    var client = './src/client/',
        server = './src/server/',
        clientApp = client + 'app/',
        temp = './.tmp/';

    var config = {
        alljs: [
            './src/**/*.js',
            '*.js'
        ],

        js: [
            clientApp + '**/*.module.js',
            clientApp + '**/*.js',
            '!' + clientApp + '**/*.spec.js'
        ],

        less: client + 'styles/styles.less',

        css: temp + 'styles.css',

        tmp: temp,

        index: client + 'index.html',

        client: client,

        server: server,

        bower: {
            json: require('./bower.json'),
            directory: './bower_components/',
            ignorePath: '../..'
        },

        defaultPort: 7203,
        nodeServer: './src/server/app.js',

        browserReloadDelay: 1000,

        htmltemplates: clientApp + '**/*.html',

        templateCache: {
            file: 'templates.js',
            options: {
                module: 'app.core',
                standAlone: false,
                root: 'app/'
            }
        },

        fonts: './bower_components/font-awesome/fonts/**/*.*',
        images: client + 'images/**/*.*',

        build: './build/'
    };

    config.getWiredepOptions = function () {
        var options = {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath
        };

        return options;
    };

    return config;
};

module.exports = function () {
    var client = './src/client/';
    var clientApp = client + 'app/';

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

        tmp: './.tmp/',

        index: client + 'index.html',

        client: client,

        bower: {
          json: require('./bower.json'),
          directory: './bower_components/',
          ignorePath: '../..'
        }
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

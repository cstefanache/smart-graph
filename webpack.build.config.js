const webpack = require('webpack');
const path = require('path');
const env = require('yargs').argv.env; // use --env with webpack 2
const pkg = require('./package.json');
const HtmlWebpackPlugin = require('html-webpack-plugin');

let libraryName = pkg.name;

let plugins = [new HtmlWebpackPlugin({template: './index.html'})],
    outputFile;

outputFile = libraryName + '.js';

const config = {
    entry: {
        isograph: __dirname + '/src/index.js',
        examples: __dirname + '/examples/index.js'
    },
    devtool: 'source-map',
    output: {
        filename: `[name].js`,
        path: __dirname + '/lib',
        library: libraryName,
        libraryTarget: 'umd',
        umdNamedDefine: true,
        globalObject: 'this'
    },
    module: {
        rules: [
            {
                test: /(\.jsx|\.js)$/,
                loader: 'babel-loader',
                exclude: /(node_modules|bower_components)/
            }, {
                test: /(\.jsx|\.js)$/,
                loader: 'eslint-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        modules: [
            path.resolve('./node_modules'), path.resolve('./src')
        ],
        extensions: ['.json', '.js']
    },
    devServer: {
        hot: true,
        inline: true,
        stats: {
            colors: true
        },
        host: '0.0.0.0',
        port: 4500
    },
    plugins: plugins
};

module.exports = config;
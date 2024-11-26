const path = require('path');

module.exports = {
    entry: './client/public/js/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'client/public/dist'),
        publicPath: '/dist/'
    },
    resolve: {
        fallback: {
            "path": false,
            "fs": false
        },
        extensions: ['.js'],
        modules: [
            path.resolve(__dirname),
            'node_modules'
        ]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'client/public'),
        },
        compress: true,
        port: 3000
    },
    devtool: 'source-map'
};

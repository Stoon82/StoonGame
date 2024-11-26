const path = require('path');

module.exports = {
    entry: './client/public/js/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'client/public/dist'),
    },
    resolve: {
        fallback: {
            "path": false,
            "fs": false
        },
        extensions: ['.js']
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
    devtool: 'source-map'
};

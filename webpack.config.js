const path = require('path');

module.exports = {
    mode: 'development',
    entry: './client/public/js/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'client/public/dist'),
        publicPath: '/dist/'
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
    resolve: {
        extensions: ['.js']
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'client/public'),
        },
        hot: true,
        port: 3000,
        open: true
    },
    devtool: 'source-map'
};

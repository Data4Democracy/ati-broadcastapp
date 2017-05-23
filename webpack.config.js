const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: {
    app: ['./src/App.jsx'],
    vendor: ['react', 'react-dom', 'whatwg-fetch', 'react-router', 'moment'],
  },
  output: {
    path: path.resolve(__dirname, 'static'),
    filename: 'app.bundle.js',
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin(
      { name: 'vendor', filename: 'vendor.bundle.js' }),
  ],
  module: {
    loaders: [
      {
        test: /\.jsx$/,
        loader: 'babel-loader',
        query: {
          presets: [
            ['env', {
              targets: ['> 4%'] },
            ],
            'react',
          ],
        },
      },
    ],
  },
  devServer: {
    port: 8000,
    contentBase: 'static',
    proxy: {
      '/api/*': {
        target: 'http://localhost:3000',
      },
    },
    historyApiFallback: true,
  },
  devtool: 'source-map',
};

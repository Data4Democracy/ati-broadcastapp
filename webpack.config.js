const webpack = require('webpack');
const path = require('path');

// we need babel to load config
require('babel-register')({ only: /server\/config/ });
const configReq = require('./server/config');

module.exports = async () => {
  const config = await (configReq.default());
  return {
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
          target: `http://localhost:${config.get('port')}`,
        },
      },
      historyApiFallback: true,
    },
    devtool: 'source-map',
  };
};

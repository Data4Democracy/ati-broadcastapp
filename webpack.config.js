const webpack = require('webpack');
const path = require('path');

// basic configuration
const webpackConfig = {
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
  devtool: 'source-map',
};

let toExport;
const isDevServer
      = process.argv.find(v => v.includes('webpack-dev-server'));
if (!isDevServer) {
  toExport = Promise.resolve(webpackConfig);
} else {
  //  We need babel to load config.js.
  //  There are complications introduced if we try to avoid this by
  //  compiling config.js before running the dev server.

  // eslint-disable-next-line global-require
  require('babel-register')({ only: /server\/config/ });
  // eslint-disable-next-line global-require
  const configReq = require('./server/config');
  toExport = configReq.default().then((config) => {
    webpackConfig.devServer = {
      port: 8000,
      contentBase: 'static',
      proxy: {
        '/api/*': {
          target: `http://localhost:${config.get('port')}`,
        },
      },
      historyApiFallback: true,
    };
    return webpackConfig;
  });
}

module.exports = toExport;

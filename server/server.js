//  Code to start up the server

//  Commented items may be of later use

import express from 'express';
import path from 'path';
import 'babel-polyfill';
import SourceMapSupport from 'source-map-support';
import * as gcpDebugAgent from '@google-cloud/debug-agent';
//  Some modules we may later need:
// import favicon from 'serve-favicon';
// import logger from 'morgan';

import getConfigPromise from './config';
import getApiRouter from './routes/index-wrapper';

SourceMapSupport.install();
gcpDebugAgent.start();

async function main() {
  const config = await getConfigPromise();
  const app = express();

  //  are we in production?
  app.locals.isProduction = !(app.get('env') === 'development');

  if (app.locals.isProduction) {
    console.error(
      'Warning: app is being run in the development environment.'
        + ' This can open security holes if used in production.');
  }

  // app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  // app.use(logger('dev'));

  const staticDir = path.join(__dirname, '..', 'static');

  app.use(express.static(staticDir));

  // trust proxy when it says, e.g., that pre-forwarded request used https
  if (config.get('is_gae')) app.set('trust proxy', 1);

  app.use('/api', await getApiRouter());

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(staticDir, 'index.html'));
  });

  const port = config.get('port');
  app.listen(port, () => {
    console.log(`App started on port ${port}`);
  });
}

(async function mainWrapper() {
  try {
    await main();
  } catch (err) {
    console.log('ERROR:', err);
  }
}());

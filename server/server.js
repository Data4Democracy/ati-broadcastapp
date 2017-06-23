//  Commented items may be of later use

import express from 'express';
import path from 'path';
import 'babel-polyfill';
import SourceMapSupport from 'source-map-support';
import gcpDebugAgent from '@google-cloud/debug-agent';
//  Some modules we may later need:
// import favicon from 'serve-favicon';
// import logger from 'morgan';
// import cookieParser from 'cookie-parser';
// import session from 'express-session';
// import connectMongo from 'connect-mongo';

import getConfigPromise from './config';
import initDb from './models/db';
import index from './routes/index';

SourceMapSupport.install();
gcpDebugAgent.start();

(async function main() {
  // const MongoStore = connectMongo(session);
  const app = express();

  // app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  // app.use(logger('dev'));

  const servePath = path.join(__dirname, '..', 'static');
  console.log(`servePath: ${servePath}`);
  app.use(express.static(servePath));
  // app.use(bodyParser.urlencoded({ extended: false }));
  // app.use(cookieParser());
  // app.use(session({
  //   secret: credentials.cookieSecret,
  //   store: new MongoStore({ mongooseConnection: mongoose.connection })
  // }));

  app.use('/api', index);

  app.get('*', (req, res) => {
    res.sendFile(path.resolve('../static/index.html'));
  });

  //  we need the error handling for the async stuff
  try {
    await initDb();
    const config = await getConfigPromise();
    const port = config.get('PORT');
    app.listen(port, () => {
      console.log(`App started on port ${port}`);
    });
  } catch (err) {
    console.log('ERROR:', err);
  }
}());

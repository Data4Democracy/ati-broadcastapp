//  Commented items may be of later use

import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import 'babel-polyfill';
import SourceMapSupport from 'source-map-support';
//  Some modules we may later need:
// import favicon from 'serve-favicon';
// import logger from 'morgan';
// import cookieParser from 'cookie-parser';
// import session from 'express-session';
// import connectMongo from 'connect-mongo';

import credentials from './credentials.js';
import './models/db';

import index from './routes/index';

SourceMapSupport.install();

// const MongoStore = connectMongo(session);
const app = express();

// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev'));

app.use(express.static('../static'));
app.use(bodyParser.json());
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

export default app;

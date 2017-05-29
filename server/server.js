//  Commented items may be of later use

import express from 'express';
import path from 'path';
import 'babel-polyfill';
import SourceMapSupport from 'source-map-support';
//  Some modules we may later need:
// import favicon from 'serve-favicon';
// import logger from 'morgan';
// import cookieParser from 'cookie-parser';
// import session from 'express-session';
// import connectMongo from 'connect-mongo';

import db from './models/db';
import index from './routes/index';

SourceMapSupport.install();

// const MongoStore = connectMongo(session);
const app = express();

// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev'));

app.use(express.static('../static'));
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

(async function main() {
  await db({ env: app.get('env') });
  try {
    app.listen(3000, () => {
      console.log('App started on port 3000');
    });
  } catch (err) {
    console.log('ERROR:', err);
  }
}());

// export default app;

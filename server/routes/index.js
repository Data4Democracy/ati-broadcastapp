// routes for the backend API
import express from 'express';
import bodyParser from 'body-parser';

import { sendError } from '../_common/express-helpers';
import validateUser from './validateUser';
import * as admin from '../controllers/admin';
import * as post from '../controllers/post';

const router = express.Router();

//  Note that router errors should be passed as objects to next, as in next
//  example.

//  error if input is not get or JSON
router.use((req, res, next) => {
  if (!(req.method === 'GET' || req.is('application/json'))) {
    sendError(res, {
      code: 415,
      message: 'Requests must be either GET or use JSON',
    });
    return;
  }
  next();
});

router.use(bodyParser.json());

//  validate the user next, adding req.atiba.user
router.use(validateUser);

router.post('/admin/update-access-token', admin.updateAccessToken);

router.post('/post', post.newPost);

// catch 404 and forward to error handler
router.use((req, res, next) => {
  sendError(res, { code: 404, message: 'Not Found' });
});

// error handler
router.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  const json = { error: { errors: [err] } };

  if (err.message) {
    json.error.message = err.message;
  }

  if (err.status) {
    json.error.code = err.status;
  }

  res.status(err.status || 500).json(json);
});

export default router;

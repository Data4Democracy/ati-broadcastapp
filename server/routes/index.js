// routes for the backend API
import express from 'express';

const router = express.Router();
// const someController = require('../controllers/someController');

// router.get('/location', someController.someFcn);

// Error handling here should actually return json!

// catch 404 and forward to error handler
router.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
router.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


export default router;

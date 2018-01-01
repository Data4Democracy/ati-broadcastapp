// routes for the backend API
import express from 'express';

import admin from '../controllers/admin';
import post from '../controllers/post';

// import refreshGroups from '../controllers/refreshGroups';
import indexCron from './index-cron';

const router = express.Router();

// router.get('/refresh-groups', refreshGroups);
router.post('/admin/update-access-token', admin.updateAccessToken);
router.post('/post', post.newPost);

// logged in admin users can also access index-cron paths
router.get((req, res, next) => {
  if (res.locals.user.get('isAdmin')) {
    indexCron(req, res, next);
  } else {
    next();
  }
});

export default router;

// routes for the backend API
import express from 'express';

import admin from '../controllers/admin';
import post from '../controllers/post';

const router = express.Router();

router.post('/admin/update-access-token', admin.updateAccessToken);
router.post('/post', post.newPost);

export default router;

const express = require('express');

const postController = require('../controllers/post');

const router = express.Router();

router.get('/all', postController.getAll);
router.get('/byId/:id', postController.getByPerson);
router.get('/byPostId/:id/:userId', postController.getByPostId);
router.get('/byFollowings/:userId', postController.getByFollowings);
router.get('/mostLiked/:userId', postController.getMostLiked);
router.get('/mostHated/:userId', postController.getMostHated);
router.get('/mostCommented/:userId', postController.getMostCommented);
router.post('/add', postController.createPost);
router.post('/like', postController.like);
router.post('/removeLike', postController.removeLike);
router.post('/dislike', postController.dislike);
router.post('/removeDislike', postController.removeDislike);
router.post('/delete', postController.deletePost);

module.exports = router;
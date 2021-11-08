const express = require('express');

const chatController = require('../controllers/chat');

const router = express.Router();

router.get('/getMessages/:username1/:username2', chatController.getMessages);
router.get('/getActive/:username', chatController.getActive);
router.post('/join', chatController.joinChat);
router.post('/leave', chatController.leaveChat);
router.post('/send', chatController.sendMessage);

module.exports = router;
const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const chatController = require('../controllers/chat.controller');

const router = express.Router();

// Create a new chat
router.post('/', authMiddleware.authUser, chatController.createChat);

// Get all chats
router.get('/', authMiddleware.authUser, chatController.getChats);

// Get all messages in a chat
router.get('/messages/:chatId', authMiddleware.authUser, chatController.getMessages);

module.exports = router;

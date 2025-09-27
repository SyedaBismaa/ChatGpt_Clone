const chatModel = require('../models/chat.models');
const messageModel = require('../models/message.models');

// Create a chat
async function createChat(req, res) {
  const { title } = req.body;
  const user = req.user;

  const chat = await chatModel.create({
    user: user._id,
    title
  });

  res.status(201).json({
    message: "Chat Created Successfully!",
    chat: {
      _id: chat._id,
      title: chat.title,
      lastActivity: chat.lastActivity,
      user: chat.user
    }
  });
}

// Get all chats for logged-in user
async function getChats(req, res) {
  const user = req.user;

  const chats = await chatModel.find({ user: user._id }).sort({ updatedAt: -1 });

  res.status(200).json({
    chats: chats.map(c => ({
      _id: c._id,
      title: c.title,
      lastActivity: c.lastActivity,
      user: c.user
    }))
  });
}

// Get all messages for a chat
async function getMessages(req, res) {
  const { chatId } = req.params;

  const messages = await messageModel.find({ chat: chatId }).sort({ createdAt: 1 });

  res.status(200).json({
    messages: messages.map(m => ({
      _id: m._id,
      content: m.content,
      role: m.role,
      user: m.user,
      chat: m.chat,
      createdAt: m.createdAt
    }))
  });
}

module.exports = { createChat, getChats, getMessages };

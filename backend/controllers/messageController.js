// controllers/messageController.js
const Message = require('../models/Message')
const Notification = require('../models/Notification')

exports.getMessages = async (req, res) => {
  try {
    const userId = req.query.userId || req.user.sub
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ sentAt: 1 })
    res.json({ success: true, count: messages.length, data: messages })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.sendMessage = async (req, res) => {
  try {
    const messageId = `msg-${Date.now()}`
    const newMessage = await Message.create({
      ...req.body,
      id: messageId,
      senderId: req.user ? req.user.sub : req.body.senderId,
      senderName: req.user ? req.user.name : req.body.senderName,
      sentAt: new Date().toISOString(),
      read: false,
    })

    // Notify recipient
    await Notification.create({
      id: `notif-${Date.now()}`,
      userId: req.body.receiverId,
      type: 'message',
      title: 'New Message',
      desc: `${req.user ? req.user.name : req.body.senderName} sent you a message about "${req.body.resourceTitle || 'Resource'}".`,
      read: false,
    })

    res.status(201).json({ success: true, data: newMessage })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

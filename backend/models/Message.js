// models/Message.js
const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    resourceId: { type: String, default: null },
    resourceTitle: { type: String, default: null },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    receiverId: { type: String, required: true },
    receiverName: { type: String, required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
    sentAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Message', MessageSchema)

// models/Notification.js
const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    type: { type: String, default: 'update' },
    title: { type: String, required: true },
    desc: { type: String, required: true },
    read: { type: Boolean, default: false },
    time: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Notification', NotificationSchema)

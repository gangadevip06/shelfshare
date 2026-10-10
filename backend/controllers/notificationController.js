// controllers/notificationController.js
const Notification = require('../models/Notification')

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.query.userId || req.user.sub
    const notifs = await Notification.find({ userId }).sort({ time: -1 })
    res.json({ success: true, count: notifs.length, data: notifs })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.markRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate({ id: req.params.id }, { read: true }, { new: true })
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' })
    res.json({ success: true, data: notif })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.markAllRead = async (req, res) => {
  try {
    const userId = req.body.userId || req.user.sub
    await Notification.updateMany({ userId }, { read: true })
    res.json({ success: true, message: 'All notifications marked read' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

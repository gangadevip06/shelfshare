// controllers/userController.js
const User = require('../models/User')

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json({ success: true, count: users.length, data: users })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id }).select('-password')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body
    const user = await User.findOneAndUpdate({ id: req.params.id }, { status }, { new: true }).select('-password')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, avatarUrl, avatar } = req.body
    const updateData = {}
    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (address) updateData.address = address
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl
    if (avatar !== undefined) updateData.avatar = avatar

    const user = await User.findOneAndUpdate(
      { id: req.user.sub },
      updateData,
      { new: true }
    ).select('-password')

    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    // Also update any resources owned by this user
    try {
      const resourceUpdate = {}
      if (phone) resourceUpdate.ownerPhone = phone
      if (name) resourceUpdate.ownerName = name
      if (Object.keys(resourceUpdate).length > 0) {
        const Resource = require('../models/Resource')
        await Resource.updateMany({ ownerId: req.user.sub }, resourceUpdate)
      }
    } catch (e) {
      console.warn('Failed to update owned resources phone/name', e)
    }

    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findOneAndDelete({ id: req.params.id })
    if (!deleted) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}



// routes/users.js
const express = require('express')
const router = express.Router()
const { getUsers, getUserById, updateUserStatus, deleteUser, updateProfile } = require('../controllers/userController')
const { protect, adminOnly } = require('../middleware/auth')

router.put('/profile', protect, updateProfile)
router.get('/', protect, adminOnly, getUsers)
router.get('/:id', protect, getUserById)
router.put('/:id/status', protect, adminOnly, updateUserStatus)
router.delete('/:id', protect, adminOnly, deleteUser)

module.exports = router

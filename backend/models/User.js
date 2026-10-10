// models/User.js
const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, default: '+91 98401 23456' },
    address: { type: String, default: 'Chennai, Tamil Nadu' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
    trustScore: { type: Number, default: 100 },
    rating: { type: Number, default: 4.8 },
    referralCode: { type: String, default: null },
    referredBy: { type: String, default: null },
    provider: { type: String, default: 'local' }, // 'local', 'google', 'github'
    avatarUrl: { type: String, default: null },
    avatar: { type: String, default: null },
    joined: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', UserSchema)

// models/Telegram.js
import mongoose, { Schema } from 'mongoose'

const ReferrerSchema = new Schema({
  referrerId: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Number,
    default: 0,
  },
})

const TelegramSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  userName: {
    type: String,
    required: true,
  },
  account: {
    type: String,
  },
  farmStartingTime: {
    type: Number,
    default: 0,
  },
  farmingPoint: {
    type: Number,
    default: 0,
  },
  referralPoint: {
    type: Number,
    default: 0,
  },
  socialTaskStatus: {
    telegram: {
      type: Boolean,
      default: false,
    },
    discord: {
      type: Boolean,
      default: false,
    },
    twitter: {
      type: Boolean,
      default: false,
    },
  },
  referrers: {
    type: [ReferrerSchema],
    default: [],
  },
})

export const Telegram = mongoose.models.Telegram || mongoose.model('Telegram', TelegramSchema)

// models/Telegram.js
import mongoose, { Schema } from 'mongoose'

const TelegramSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
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
    type: [String],
    default: [],
  },
})

export const Telegram = mongoose.models.Telegram || mongoose.model('Telegram', TelegramSchema)

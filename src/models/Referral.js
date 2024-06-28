// models/Refferal.ts
import mongoose, { Schema } from 'mongoose'

const ReferralSchema = new Schema({
  owner: {
    type: String,
    required: true,
  },
  inviteCode: { type: String, required: true, unique: true },
  redeemer: { type: String, unique: true },
  redeemed: {
    type: Boolean,
    default: false,
  },
  signMsg: { type: String },
})

export const Referral = mongoose.models.Referral || mongoose.model('Referral', ReferralSchema)

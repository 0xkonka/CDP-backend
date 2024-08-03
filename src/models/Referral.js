import mongoose, { Schema } from 'mongoose'

const ReferralSchema = new Schema({
  owner: {
    type: String,
    required: true,
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
  },
  redeemer: {
    type: Schema.Types.Mixed,
    required: false, // Make this field optional
  },
  redeemed: {
    type: Boolean,
    default: false,
  },
  signMsg: {
    type: String,
  },
  type: {
    type: String,
    enum: ['testnet', 'mainnet'],
    required: true,
  },
})

export const Referral = mongoose.models.Referral || mongoose.model('Referral', ReferralSchema)

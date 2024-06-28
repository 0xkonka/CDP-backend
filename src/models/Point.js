// models/Point.ts
import mongoose, { Schema } from 'mongoose'

const PointSchema = new Schema({
  account: {
    type: String,
    required: true,
    unique: true,
  },
  xpPoint: { type: Number, default: 0 },
  referralPoint: { type: Number, default: 0 },
  multiplier_permanent: { type: Number, default: 1 },
  multiplier_temporary: { type: Number, default: 0 },
  endTimestamp: { type: Number },
})

export const Point = mongoose.models.Point || mongoose.model('Point', PointSchema)

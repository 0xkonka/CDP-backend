// models/Point.ts
import mongoose, { Schema } from 'mongoose'

const xpPointSchema = new Schema({
  point: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Number,
    default: 0,
  },
})

const PointSchema = new Schema({
  account: {
    type: String,
    required: true,
    unique: true,
  },
  xpPoint: {
    type: [xpPointSchema],
    default: [],
  },
  referralPoint: {
    type: [xpPointSchema],
    default: [],
  },
  multiplier_permanent: { type: Number, default: 1 },
  multiplier_temporary: { type: Number, default: 0 },
  endTimestamp: { type: Number },
})

export const Point = mongoose.models.Point || mongoose.model('Point', PointSchema)

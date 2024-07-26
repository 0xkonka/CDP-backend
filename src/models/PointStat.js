// models/PointStat.ts
import mongoose, { Schema } from 'mongoose'

const PointStatSchema = new Schema({
  lastUpdateTime: {
    type: String,
  },
  epoch: {
    type: String,
    default: 1 * 24 * 60 * 60, // 1 day
  },
})

export const PointStat = mongoose.models.PointStat || mongoose.model('PointStat', PointStatSchema)

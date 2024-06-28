// models/PointStat.ts
import mongoose, { Schema } from 'mongoose'

const PointStatSchema = new Schema({
  lastUpdateTime: {
    type: String,
  },
})

export const PointStat = mongoose.models.PointStat || mongoose.model('PointStat', PointStatSchema)

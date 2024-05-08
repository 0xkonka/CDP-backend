// models/SomeModel.ts
import mongoose, { Schema } from 'mongoose'

const PointSchema = new Schema({
    account: {
        type: String,
        required: true,
        unique: true,
    },
    xpPoint: { type: Number, default: 0 },
    multiplier: { type: Number, default: 1},
    endTimestamp: { type: Number }
})

export const Point = mongoose.models.Point || mongoose.model('Point', PointSchema)

import { PointStat } from '../models/PointStat.js'

export const updatePointStat = async () => {
  const pointStat = await PointStat.findOne({})
  if (pointStat) {
    pointStat.lastUpdateTime = Math.floor(Date.now() / 1000)
    await pointStat.save()
  } else {
    await PointStat.create({ lastUpdateTime: Math.floor(Date.now() / 1000) })
  }
}

export const getLastUpdateTime = async () => {
  const pointStat = await PointStat.findOne({})
  return pointStat ? pointStat.lastUpdateTime : null
}

// middlewares/validateRealIp.js

const allowedRealIp = '167.71.105.201'

export const validateRealIp = (req, res, next) => {
  const realIp = req.headers['x-real-ip']

  console.log('x-real-ip', req.headers)

  if (realIp !== allowedRealIp) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  next()
}

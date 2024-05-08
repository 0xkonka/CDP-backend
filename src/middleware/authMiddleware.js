import jwt from 'jsonwebtoken'

export function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization']
  console.log('bearerHeader', bearerHeader)
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ')
    const bearerToken = bearer[1]
    if (!bearerToken) return res.status(401).json({ error: 'Access denied' })
    try {
      const decoded = jwt.verify(bearerToken, 'your-secret-key')
      console.log('decoded', decoded)
      req.secret = decoded.secret
      next()
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' })
    }
  } else {
    res.status(401).json({ error: 'Invalid token' })
  }
}

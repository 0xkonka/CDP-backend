import jwt from 'jsonwebtoken'

export function verifyToken(req: any, res: any, next: any) {
  const bearerHeader = req.headers['authorization']
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ')
    const bearerToken = bearer[1]
    if (!bearerToken) return res.status(401).json({ error: 'Access denied' })
    try {
      const decoded: any = jwt.verify(bearerToken, 'your-secret-key')
      req.secret = decoded.secret
      next()
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' })
    }
  } else {
    res.status(401).json({ error: 'Invalid token' })
  }
}
import jwt from 'jsonwebtoken'

export function verifyToken(role) {
  return (req, res, next) => {
    const bearerHeader = req.headers['authorization']
    console.log('bearerHeader', bearerHeader)
    if (typeof bearerHeader !== 'undefined') {
      const bearer = bearerHeader.split(' ')
      const bearerToken = bearer[1]
      if (!bearerToken) return res.status(401).json({ error: 'Access denied' })
      try {
        const decoded = jwt.verify(bearerToken, 'your-secret-key')
        console.log('decoded', decoded)

        if (decoded.secret !== 'tren') {
          return res.status(403).json({ error: 'Wrong Secret' })
        }
        // Check if the user has the required role
        if (decoded.role !== role) {
          return res.status(403).json({ error: 'Forbidden: Insufficient privileges' })
        }

        req.secret = decoded.secret
        req.role = decoded.role
        next()
      } catch (error) {
        res.status(401).json({ error: 'Invalid token' })
      }
    } else {
      res.status(401).json({ error: 'Invalid token' })
    }
  }
}

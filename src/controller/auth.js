
import {
  BAD_REQ_CODE,
  CONFLICT_CODE,
  FORBIDDEN_CODE,
  FORBIDDEN_MSG,
  NOT_FOUND_CODE,
  NOT_FOUND_MSG,
  SERVER_ERROR_CODE,
  SERVER_ERROR_MSG,
  SUCCESS_CODE,
} from '../utils/response.js'
import jwt from 'jsonwebtoken'

export const generateToken = async (req, res, next) => {
  try {
    const { secret, role } = req.body
    
    if (!secret || !role) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing secret or role' })
    }

    // Validate role
    const validRoles = ['admin', 'telegram']
    if (!validRoles.includes(role)) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Invalid role' })
    }

    const token = jwt.sign({ secret, role }, 'your-secret-key')

    return res.status(SUCCESS_CODE).send({ token })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}
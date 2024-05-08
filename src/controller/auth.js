import { NextFunction, Request, Response } from 'express'
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
} from '../utils/response'
import jwt from 'jsonwebtoken'

export const generateToken = async (req, res, next) => {
  try {
    const { secret } = req.body
    
    if (!secret) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing secret' })
    }

    const token = jwt.sign({ secret }, 'your-secret-key')

    return res.status(SUCCESS_CODE).send({ token })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import routes from '../src/routes'
import db from '../src/db'

dotenv.config()

const app = express()
const port = process.env.PORT || 8000

const corsOptions = {
  origin: '*', // Allows all domains
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Explicitly allow these methods
  preflightContinue: false, // Responses to preflight requests don't pass control to next middleware
  optionsSuccessStatus: 204, // Status to return for successful OPTIONS requests
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Specify allowed headers
  credentials: true, // Allow credentials
  exposedHeaders: ['Content-ID', 'X-Response-Time'], // Headers that are safe to expose to the API of a CORS API specification
}

app.use(cors(corsOptions))

app.use(express.json())
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'same-origin');
  next();
});

db.connect()

// API routes
routes(app)

app.get('/ping', (req, res, next) => {
  res.send('ok')
  next()
})

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})

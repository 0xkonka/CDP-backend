import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import bodyParser from 'body-parser'
import morgan from 'morgan'

import { router } from './src/routes/router'
import db from './src/db'
import postRouter from './src/routes/posts'

dotenv.config()

const app = express()

const port = process.env.PORT || 8000

app.use(bodyParser.json())
app.use(morgan('dev'))

const corsOptions = {
  // origin: ['https://tren-staging.vercel.app', 'http://localhost:3000'], // TODO: use this in final version
  origin: function (origin: any, callback: any) {
    if (!origin) {
      callback(null, true)
    } else if (
      origin.match(/^.+\.vercel\.app$/) ||
      origin === 'http://localhost:3000' ||
      origin === 'http://localhost:8000'
    ) {
      // Allow if it's a Vercel deployment or local development
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'], // Allowed headers
}

app.use(cors(corsOptions))

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Library API",
      version: "1.0.0",
      description: "A simple Express Library API",
      termsOfService: "http://example.com/terms/",
      contact: {
        name: "API Support",
        url: "http://www.exmaple.com/support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: "https://nodejs-swagger-api.vercel.app/",
        description: "My API Documentation",
      },
    ],
  },
  apis: ['src/**/*.ts'],
}

const CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.6.2/swagger-ui.min.css'

const swaggerSpec = swaggerJsdoc(swaggerOptions)

// app.use(express.json())
// app.use((req, res, next) => {
//   res.set('X-Content-Type-Options', 'nosniff')
//   res.set('X-Frame-Options', 'DENY')
//   res.set('Referrer-Policy', 'same-origin')
//   next()
// })

db.connect()

// API routes

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    // customCss:
    //   '.swagger-ui .opblock .opblock-summary-path-description-wrapper { align-items: center; display: flex; flex-wrap: wrap; gap: 0 10px; padding: 0 10px; width: 100%; }',
    customCssUrl: CSS_URL,
  })
)

app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

app.get('/ping', (req, res, next) => {
  res.send('ok')
  next()
})

app.use('/api', router)
app.use('/posts', postRouter)

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})

import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'

import routes from '../src/routes'
import db from '../src/db'

dotenv.config()

const app = express()
const port = process.env.PORT || 8000

const swaggerOptions = {
  definition: {
    swagger: '2.0',
    info: {
      title: 'Tren Express API',
      version: '1.0.0',
      description: 'This is a REST API application made with Express. It retrieves data from JSONPlaceholder.',
      license: {
        name: 'Licensed Under MIT',
        url: 'https://spdx.org/licenses/MIT.html',
      },
      contact: {
        name: 'JSONPlaceholder',
        url: 'https://jsonplaceholder.typicode.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Local Server URL',
      },
      {
        url: 'https://be-express-lime.vercel.app/',
        description: 'Backend Server URL',
      },
    ],
  },
  // Paths to files containing OpenAPI definitions
  apis: [`src/routes/index.ts`],
}

// [`${__dirname}/routes/abc.js`]

const CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.6.2/swagger-ui.min.css'

const swaggerSpec = swaggerJsdoc(swaggerOptions)

const corsOptions = {
  // origin: ['https://tren-staging.vercel.app', 'http://localhost:3000'], // TODO: use this in final version
  origin: function (origin: any, callback: any) {
    if (!origin) {
      callback(null, true)
    } else if (origin.match(/^.+\.vercel\.app$/) || origin === 'http://localhost:3000') {
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

app.use(express.json())
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('X-Frame-Options', 'DENY')
  res.set('Referrer-Policy', 'same-origin')
  next()
})

// API routes
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss:
      '.swagger-ui .opblock .opblock-summary-path-description-wrapper { align-items: center; display: flex; flex-wrap: wrap; gap: 0 10px; padding: 0 10px; width: 100%; }',
    customCssUrl: CSS_URL,
    explorer: true
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

app.use(express.static("./"));

db.connect()

routes(app)

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})

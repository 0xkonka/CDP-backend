import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import swaggerUI from 'swagger-ui-express'
import swaggerJsDoc from 'swagger-jsdoc'
import bodyParser from 'body-parser'
import apiRouter from './src/Routes/index.js'
import helloRouter from './src/hello.js'
import db from './src/db/index.js'

dotenv.config()
const PORT = process.env.PORT || 2001

const corsOptions = {
  origin: ['https://tren-staging.vercel.app', 'http://localhost:3000', 'http://localhost:2001'], // Allowed origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'], // Allowed headers
}

// CDN CSS

const CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.6.2/swagger-ui.min.css'
let customCss = `
  .swagger-ui .opblock .opblock-summary-path { max-width: 100% !important} 
  .swagger-ui .opblock .opblock-summary-description { padding: 0 10px }
  `

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Library API',
      version: '1.0.0',
      description: 'A simple Express Library API',
      termsOfService: 'http://example.com/terms/',
      contact: {
        name: 'API Support',
        url: 'http://www.exmaple.com/support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'https://be-express-lime.vercel.app/',
        description: 'My API Documentation',
      },
      {
        url: 'http://localhost:2001/',
        description: 'My API Documentation',
      },
    ],
  },
  // This is to call all the file
  apis: ['src/**/*.js'],
}

const specs = swaggerJsDoc(swaggerOptions)

const app = express()

app.use(bodyParser.json()) // to use body object in requests
app.use(morgan('dev'))
app.use(cors(corsOptions))
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('X-Frame-Options', 'DENY')
  res.set('Referrer-Policy', 'same-origin')
  next()
})

db.connect()

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs, { customCssUrl: CSS_URL, customCss }))
app.use('/', helloRouter)
app.use('/api', apiRouter)

app.listen(PORT, () => console.log(`Server runs on port ${PORT}`))

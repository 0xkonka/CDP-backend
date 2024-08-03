import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUI from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import bodyParser from 'body-parser';
import NodeCron from 'node-cron';
import apiRouter from './src/Routes/index.js';
import helloRouter from './src/hello.js';
import db from './src/db/index.js';
import { sendNotifications } from './src/controller/telegram.js';
import { updateTreningPoints } from './src/contractCall/pointKeeper.js';

dotenv.config();
const PORT = process.env.PORT || 8000;

const corsOptions = {
  origin: [
    'https://tren.finance',
    'https://www.tren.finance',
    'https://testnet.tren.finance',
    'https://www.testnet.tren.finance',
    'https://tren-staging.vercel.app',
    'https://www.tren-staging.vercel.app',
    'https://app.tren.finance',
    'https://www.app.tren.finance',
    'https://telegram.tren.finance',
    'https://www.telegram.tren.finance',
    'https://miniapp.tren.finance',
    'http://localhost:3000',
    'http://localhost:8000',
  ], // Allowed origins
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
      title: 'Tren Backend API',
      version: '1.0.0',
      description: '',
    },
    servers: [
      {
        url: 'https://api.tren.finance/',
        description: 'Vercel Deployment',
      },
      {
        url: 'http://localhost:8000/',
        description: 'Local Deployment',
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
// app.use(cors())
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

// NodeCron.schedule('*/1 * * * *', async () => {
//   await sendNotifications();
//   console.log('Cron job executed every 1 minute');
// });

// NodeCron.schedule('0 0 * * *', async () => {
//   await updateTreningPoints();
//   console.log('Cron job executed at UTC 00:00:00');
// });

// await updateTreningPoints();

app.listen(PORT, () => console.log(`Server runs on port ${PORT}`));

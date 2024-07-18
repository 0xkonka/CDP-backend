import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUI from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import bodyParser from 'body-parser';
import apiRouter from './src/Routes/index.js';
import helloRouter from './src/hello.js';
import db from './src/db/index.js';

dotenv.config();
const PORT = process.env.PORT || 8000;

const allowedOrigins = [
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
  'https://telegram-mini-app-kappa.vercel.app',
  'http://localhost:8000',
  'http://localhost:3000',
  'https://be-express-lime.vercel.app', // Added deployment domain
];

const allowedRealIp = '167.71.105.201';

const corsOptions = {
  origin: function (origin, callback) {
    console.log(`CORS request from origin: ${origin}`);
    if (!origin) return callback(null, true); // Allow requests with no origin (like mobile apps, curl requests)
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true,
};

const CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.6.2/swagger-ui.min.css';
let customCss = `
  .swagger-ui .opblock .opblock-summary-path { max-width: 100% !important } 
  .swagger-ui .opblock .opblock-summary-description { padding: 0 10px }
`;

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
        url: 'https://be-express-lime.vercel.app/',
        description: 'Vercel Deployment',
      },
      {
        url: 'http://localhost:8000/',
        description: 'Local Deployment',
      },
    ],
  },
  apis: ['src/**/*.js'],
};

const specs = swaggerJsDoc(swaggerOptions);

const app = express();

app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors(corsOptions));

// Middleware to validate Origin or x-real-ip headers, or allow Swagger UI access
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const realIp = req.headers['x-real-ip'];
  const referer = req.headers.referer;

  console.log('Request origin:', origin);
  console.log('x-real-ip:', realIp);
  console.log('referer:', referer);

  if (req.path.startsWith('/api-docs')) {
    return next(); // Allow requests to the Swagger UI
  }

  if (referer && referer.includes('/api-docs')) {
    return next();
  }

  if (origin && allowedOrigins.includes(origin)) {
    return next();
  }

  if (realIp === allowedRealIp) {
    return next();
  }

  return res.status(403).json({ error: 'Forbidden' });
});

app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'same-origin');
  next();
});

db.connect();

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs, { customCssUrl: CSS_URL, customCss }));
app.use('/', helloRouter);
app.use('/api', apiRouter);

app.listen(PORT, () => console.log(`Server runs on port ${PORT}`));

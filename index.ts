import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import routes from './src/routes'
import db from './src/db'

dotenv.config()

const app = express()
const port = process.env.PORT
const corsOptions = {
  origin: ['https://tren-staging.vercel.app', 'http://localhost:3000'], // Allowed origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'], // Allowed headers
};

app.use(cors(corsOptions))
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'same-origin');
  next();
});

db.connect();
// app.use(express.json());
// app.use(function (_, res, next) {
//   res.header('Content-Type', 'application/json');
//   next();
// });

// app.use(
//   bodyParser.urlencoded({
//     extended: true,
//   })
// );
// app.use(bodyParser.json());

// API routes
routes(app)

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})

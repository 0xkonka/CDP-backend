import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import routes from '../src/routes'
import db from '../src/db'

dotenv.config()

const app = express()
const port = process.env.PORT

const options = {
  origin: '*',
}

app.set('trust proxy', true)

app.use(cors(options)).use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('X-Frame-Options', 'DENY')
  res.set('Referrer-Policy', 'same-origin')
  next()
})
db.connect()
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

app.get('/ping', (req, res, next) => {
  res.send('ok')
  next()
})

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})

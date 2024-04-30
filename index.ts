import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import routes from './src/routes'
import db from './src/db'

dotenv.config()

const app = express()
const port = process.env.PORT
const options = {
  origin: '*',
}

app.use(cors(options))
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

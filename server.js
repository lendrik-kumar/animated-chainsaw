import express from 'express'
import cors from 'cors'
import { connectDataBase } from './config/db.js'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import userRoutes from './routes/user.routes.js'
import helmet from 'helmet'
import { limitApi, limitAuth } from './middlewares/rateLimit.middleware.js'
import { sanitizeRequest, enforceJson, hpp } from './middlewares/sanitize.middleware.js'
import adminRoutes from './routes/admin.routes.js'

dotenv.config()

const app = express()
app.disable('x-powered-by')

const PORT = process.env.PORT || 8000

const DEV_ORIGIN ='https://gdg-recruitment-portal-front.vercel.app/'
app.set('trust proxy', 1)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'same-site' }
}))

app.use(cors({
  origin: [DEV_ORIGIN, "https://marc-unthankful-likely.ngrok-free.dev"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true
}))

app.use(express.json({ limit: '200kb' }))
app.use(cookieParser())
app.use(hpp)
app.use(sanitizeRequest)
app.use(enforceJson)

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  next()
})

app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin
    if (origin && origin !== DEV_ORIGIN) {
      return res.status(403).json({ success: false, message: 'Forbidden origin' })
    }
  }
  next()
})

app.get(['/api', '/api/'], limitApi, (req, res) => {
  res.send('ok')
})

app.use('/api/user', limitApi, userRoutes)
app.use('/api/admin', adminRoutes)

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' })
})

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({ success: false, message: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

await connectDataBase()

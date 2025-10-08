import express from 'express'
import cors from 'cors'
import { connectDataBase } from './config/db.js'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import userRoutes from './routes/user.routes.js'

dotenv.config()

const app = express()

const PORT = process.env.PORT || 8000

app.use(cors({
    origin: "http://localhost:5173", // Replace wildcard with specific origin
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}))

app.use(express.json())
app.use(cookieParser())

app.get('/api', (req, res) => {
    res.send('Hello World!')
})

app.use('/api/auth', userRoutes)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

connectDataBase

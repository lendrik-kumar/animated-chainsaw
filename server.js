import express from 'express'
import cors from 'cors'
import { connectDataBase } from './config/db.js'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

dotenv.config()

const app = express()

const PORT = process.env.PORT || 8000

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}))

app.use(express.json())
app.use(cookieParser())

app.get('/api', (req, res) => {
    res.send('Hello World!')
})
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

connectDataBase

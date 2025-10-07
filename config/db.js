import dotenv from "dotenv"
import mongoose from "mongoose"

dotenv.config()

const dbUri = process.env.MONGO_URI

export const connectDataBase = await mongoose
.connect(dbUri)
.then(() => {
    console.log("mongoDb connected")
})
.catch(e => console.log("connection failed:" + e)
)
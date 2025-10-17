import dotenv from "dotenv"
import mongoose from "mongoose"

dotenv.config()

const dbUri = process.env.MONGO_URI

export const connectDataBase = async() => {
  if (!dbUri) {
    throw new Error("MONGO_URI is not set")
  }
  await mongoose.connect(dbUri)
  console.log("connected to db")
}
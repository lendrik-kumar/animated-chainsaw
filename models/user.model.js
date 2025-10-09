import mongoose from "mongoose"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[0-9]{10}$/

const questionSnapshotSchema = new mongoose.Schema(
  {
    id: mongoose.Schema.Types.ObjectId,
    question: String,
    options: [String],
    image: String
  },
  { _id: false }
)

const quizSnapshotSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    duration: Number,
    questions: [questionSnapshotSchema]
  },
  { _id: false }
)

const responseSchema = new mongoose.Schema(
  {
    questionId: mongoose.Schema.Types.ObjectId,
    selectedOption: String
  },
  { _id: false }
)

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, "Please enter a valid email address"]
    },
    phone: {
      type: String,
      trim: true,
      match: [PHONE_REGEX, "Phone number must be a valid 10-digit number"]
    },
    hasStarted: {
      type: Boolean,
      default: false
    },
    hasSubmitted: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      default: 0,
      min: [0, "Score cannot be negative"]
    },
    responses: {
      type: [responseSchema],
      default: []
    },
    qualifiedForInterview: {
      type: Boolean,
      default: false
    },
    quiz: {
      type: quizSnapshotSchema, // lightweight snapshot of quiz
      default: null
    },
    timeUsed: {
      type: Number,
      default: 0,
      min: [0, "Time used cannot be negative"]
    }
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "users"
  }
)

userSchema.pre("save", function (next) {
  if (this.email) this.email = this.email.toLowerCase().trim()
  if (this.name) this.name = this.name.trim()
  if (this.phone) this.phone = this.phone.trim()
  next()
})

userSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("Email already exists"))
  } else {
    next(error)
  }
})

export const User = mongoose.model("User", userSchema)
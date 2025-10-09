import mongoose from "mongoose";
import { Quiz } from "./quiz.model.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, "Please enter a valid email address"],
    },
    phone: {
      type: String,
      trim: true,
      match: [PHONE_REGEX, "Phone number must be a valid 10-digit number"],
    },
    hasStarted: {
      type: Boolean,
      default: false,
    },
    hasSubmitted: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      default: 0,
      min: [0, "Score cannot be negative"],
    },
    responses: {
      type: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        selectedOption: {
            type: String,
        }
      }],
      default: [],
    },
    qualifiedForInterview: {
      type: Boolean,
      default: false,
    },
    quiz: {
      type: Quiz.schema,
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
    collection: "users",
  }
);

userSchema.pre("save", function (next) {
  if (this.email) this.email = this.email.toLowerCase().trim();
  if (this.name) this.name = this.name.trim();
  if (this.phNo) this.phNo = this.phNo.trim();
  next();
});

userSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("Email already exists"));
  } else {
    next(error);
  }
});

export const User = mongoose.model("User", userSchema);
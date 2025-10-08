import mongoose from "mongoose";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const questionsSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      minlength: [5, "Question must be at least 5 characters long"],
    },
    options: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2,
        message: "At least two options are required",
      },
      required: [true, "Options are required"],
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
    },
    image: {
      type: String,
      trim: true,
      validate: {
        validator: (v) =>
          !v ||
          /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v),
        message: "Invalid image URL",
      },
    },
    correctAnswers: {
      type: Number,
      default: -1,
      min: [-1, "Invalid correct answer index"],
    },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema({
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
    },
    questions: {
      type: [questionsSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one question is required",
      },
      required: true,
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "quizzes",
  }
);

quizSchema.pre("save", function (next) {
  this.title = this.title.trim();
  this.description = this.description.trim();
  next();
});

export const Quiz = mongoose.model("Quiz", quizSchema);
import mongoose from 'mongoose';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/; 

const allowedSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Please enter a valid email address'],
    },

    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [PHONE_REGEX, 'Phone number must be a valid 10-digit number'],
    },
  },
  {
    timestamps: true, 
    versionKey: false,
    collection: 'allowed_users',
  }
);

allowedSchema.pre('save', function (next) {
  this.email = this.email.toLowerCase().trim();
  this.name = this.name.trim();
  this.phone = this.phone.trim();
  next();
});

allowedSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    if (error.keyValue.email) {
      next(new Error('Email already exists'));
    } else if (error.keyValue.phone) {
      next(new Error('Phone number already exists'));
    } else {
      next(new Error('Duplicate field value'));
    }
  } else {
    next(error);
  }
});

export const Allowed = mongoose.model('Allowed', allowedSchema);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    fatherName: {
      type: String,
      required: [true, 'Father name is required'],
      trim: true
    },
    cnicNumber: {
      type: String,
      required: [true, 'CNIC number is required'],
      unique: true,
      trim: true
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other']
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    profilePicture: {
      type: String,
      default: '/uploads/default-avatar.svg'
    },
    bannerImage: {
      type: String,
      default: '/uploads/default-banner.svg'
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    bio: {
      type: String,
      default: '',
      trim: true
    },
    relationshipPreferences: {
      interestedIn: {
        type: String,
        enum: ['Male', 'Female', 'All'],
        default: 'All'
      },
      minAge: {
        type: Number,
        default: 18
      },
      maxAge: {
        type: Number,
        default: 100
      }
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    friendRequests: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected'],
          default: 'pending'
        }
      }
    ],
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    reportedUsers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        reason: {
          type: String,
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    photos: [
      {
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    isAdmin: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving to database
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

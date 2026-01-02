import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'business_user'],
        message: 'Role must be either admin or business_user'
      },
      required: [true, 'Role is required']
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: function () {
        return this.role === 'business_user';
      }
    },
    name: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Index for faster queries
userSchema.index({ role: 1 });
userSchema.index({ businessId: 1 }, { sparse: true });

const User = mongoose.model('User', userSchema);

export default User;

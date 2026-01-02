import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business ID is required'],
      index: true
    },
    clientId: {
      type: String,
      required: [true, 'Client ID is required'],
      index: true
    },
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    points: {
      type: Number,
      default: 0
    },
    isActivated: {
      type: Boolean,
      default: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound index for searching within a business
clientSchema.index({ businessId: 1, clientId: 1 }, { unique: true });
clientSchema.index({ businessId: 1, name: 1 });
clientSchema.index({ businessId: 1, phone: 1 });
clientSchema.index({ businessId: 1, email: 1 });

const Client = mongoose.model('Client', clientSchema);

export default Client;

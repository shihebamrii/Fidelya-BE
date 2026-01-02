import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
      index: true
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business ID is required'],
      index: true
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    },
    points: {
      type: Number,
      required: [true, 'Points value is required']
    },
    beforePoints: {
      type: Number,
      required: [true, 'Before points value is required']
    },
    afterPoints: {
      type: Number,
      required: [true, 'After points value is required']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performed by user is required']
    },
    note: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound indexes for efficient querying
transactionSchema.index({ clientId: 1, createdAt: -1 });
transactionSchema.index({ businessId: 1, createdAt: -1 });
transactionSchema.index({ itemId: 1 }, { sparse: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;

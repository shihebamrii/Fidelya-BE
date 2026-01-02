import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    points: {
      type: Number,
      required: [true, 'Points value is required'],
      min: [1, 'Points must be at least 1']
    },
    type: {
      type: String,
      enum: {
        values: ['earn', 'redeem'],
        message: 'Type must be either earn or redeem'
      },
      required: [true, 'Item type is required']
    },
    visibleToClient: {
      type: Boolean,
      default: true
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

// Index for listing items by business and type
itemSchema.index({ businessId: 1, type: 1 });
itemSchema.index({ businessId: 1, visibleToClient: 1 });

const Item = mongoose.model('Item', itemSchema);

export default Item;

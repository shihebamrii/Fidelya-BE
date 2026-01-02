import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      index: true
    },
    slug: {
      type: String,
      unique: true,
      // required: true, // Will be required after migration, but for now let's allow it to be created via script
      trim: true,
      lowercase: true,
      index: true
    },
    category: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true,
      index: true
    },
    region: {
      type: String,
      trim: true
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true
    },
    logoUrl: {
      type: String,
      trim: true
    },
    activationCode: {
      type: String,
      trim: true
    },
    allowNegativePoints: {
      type: Boolean,
      default: false
    },
    createdByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    cardDesign: {
      primaryColor: { type: String, default: '#0f172a' },
      secondaryColor: { type: String, default: '#334155' },
      pattern: { type: String, default: 'geometric' }, // geometric, noise, circles
      textColor: { type: String, default: '#ffffff' }
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

// Generate slug before saving
businessSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Text index for search functionality
businessSchema.index({ name: 'text', category: 'text', city: 'text' });

const Business = mongoose.model('Business', businessSchema);

export default Business;

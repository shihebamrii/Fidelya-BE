import 'dotenv/config';
import mongoose from 'mongoose';
import Business from '../src/models/Business.js';

const repairSlugs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const businesses = await Business.find({}).lean();
    
    for (const b of businesses) {
        const generatedSlug = b.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        console.log(`Updating ${b.name}: "${b.slug}" -> "${generatedSlug}"`);
        await Business.updateOne({ _id: b._id }, { $set: { slug: generatedSlug } });
    }
    
    console.log('✅ Slugs repaired.');
    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
    await mongoose.disconnect();
  }
};

repairSlugs();

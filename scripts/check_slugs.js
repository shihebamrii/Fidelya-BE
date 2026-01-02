import 'dotenv/config';
import mongoose from 'mongoose';
import Business from '../src/models/Business.js';

const checkSlugs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const businesses = await Business.find({}, 'name slug').lean();
    console.log('--- ALL BUSINESSES ---');
    businesses.forEach(b => console.log(`${b.name}: "${b.slug}"`));
    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
    await mongoose.disconnect();
  }
};

checkSlugs();

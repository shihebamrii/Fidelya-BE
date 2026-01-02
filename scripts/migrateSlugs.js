
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Business from '../src/models/Business.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const generateSlug = (name) => {
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-') // Replace spaces and non-word chars with -
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing -
};

const migrateSlugs = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const businesses = await Business.find({});
    console.log(`Found ${businesses.length} businesses to migrate.`);

    for (const business of businesses) {
      if (!business.slug) {
        let slug = generateSlug(business.name);
        
        // Ensure uniqueness
        let existing = await Business.findOne({ slug });
        let counter = 1;
        while (existing && existing._id.toString() !== business._id.toString()) {
          slug = `${generateSlug(business.name)}-${counter}`;
          existing = await Business.findOne({ slug });
          counter++;
        }

        business.slug = slug;
        await business.save();
        console.log(`Updated: ${business.name} -> ${slug}`);
      } else {
        console.log(`Skipped: ${business.name} (already has slug: ${business.slug})`);
      }
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

migrateSlugs();

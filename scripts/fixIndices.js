
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const fixIndices = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const collection = mongoose.connection.collection('clients');
    
    // List indexes
    const indexes = await collection.indexes();
    console.log('Current Indexes:', indexes);

    // Find the bad index (clientId_1 with unique: true)
    const badIndex = indexes.find(idx => idx.key.clientId === 1 && idx.unique === true && !idx.key.businessId);

    if (badIndex) {
      console.log(`Found obsolete unique index: ${badIndex.name}. Dropping...`);
      await collection.dropIndex(badIndex.name);
      console.log('Index dropped successfully.');
    } else {
      console.log('No obsolete unique index found on clientId.');
    }

    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixIndices();

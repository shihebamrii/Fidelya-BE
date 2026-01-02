
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Business from '../src/models/Business.js';
import Client from '../src/models/Client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const slug = 'testb1';
    const clientId = 'client3';

    console.log(`Searching for Business with slug: "${slug}"`);
    const business = await Business.findOne({ slug });

    if (!business) {
        console.log('❌ Business NOT FOUND');
        // List all slugs
        const all = await Business.find({}).select('name slug');
        console.log('Available businesses:', all);
    } else {
        console.log('✅ Business FOUND:', business.name, business._id);
        
        console.log(`Searching for Client: "${clientId}" in business: ${business._id}`);
        const client = await Client.findOne({ businessId: business._id, clientId });
        
        if (!client) {
            console.log('❌ Client NOT FOUND');
            // List all clients for this business
            const clients = await Client.find({ businessId: business._id }).select('clientId name');
            console.log(`Available clients for ${business.name}:`, clients.map(c => c.clientId));
        } else {
            console.log('✅ Client FOUND:', client._id);
        }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

verifyData();

import 'dotenv/config';
import mongoose from 'mongoose';
import { Client } from '../src/models/index.js';

const checkDuplicates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const clients = await Client.find({ clientId: 'client1' }).lean();
    console.log(`Found ${clients.length} clients with clientId 'client1':`);
    clients.forEach(c => {
        console.log(`- _id: ${c._id}, businessId: ${c.businessId}, name: ${c.name}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
    await mongoose.disconnect();
  }
};

checkDuplicates();

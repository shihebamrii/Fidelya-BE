import 'dotenv/config';
import mongoose from 'mongoose';
import { User, Client } from '../src/models/index.js';

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const users = await User.find({});
    console.log('--- ALL USERS ---');
    users.forEach(u => console.log(`${u.email} (${u.role}) - Business: ${u.businessId}`));

    const client = await Client.findOne({ clientId: 'client1' });
    if (client) {
         console.log('\n--- TARGET CLIENT ---');
         console.log(`Client 1 Business: ${client.businessId}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
    await mongoose.disconnect();
  }
};

listUsers();

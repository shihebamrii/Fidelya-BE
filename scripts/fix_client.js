import 'dotenv/config';
import mongoose from 'mongoose';
import { User, Client } from '../src/models/index.js';

const fixClient = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const email = 'teste1@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
        console.log('User not found');
        return;
    }

    const client = await Client.findOne({ clientId: 'client1' });
    if (!client) {
        console.log('Client not found');
        return;
    }

    console.log(`Updating client1 from business ${client.businessId} to ${user.businessId}...`);
    client.businessId = user.businessId;
    await client.save();
    console.log('✅ Client updated successfully.');

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
    await mongoose.disconnect();
  }
};

fixClient();

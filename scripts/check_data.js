import 'dotenv/config';
import mongoose from 'mongoose';
import { User, Client, Business } from '../src/models/index.js';

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'employee@coffeeshop.com'; // Default seed employee
    const clientIdStr = 'client1'; // The ID failing

    const user = await User.findOne({ email });
    console.log('User:', user ? `${user.email} (Business: ${user.businessId})` : 'Not found');

    const client = await Client.findOne({ clientId: clientIdStr });
    console.log('Client:', client ? `${client.name} (ID: ${client.clientId}, Business: ${client.businessId})` : 'Not found');

    if (user && client) {
        console.log('Match?', user.businessId.toString() === client.businessId.toString());
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
    await mongoose.disconnect();
  }
};

checkData();

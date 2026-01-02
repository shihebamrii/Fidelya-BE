import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/models/index.js';
import { hashPassword } from '../src/services/auth.service.js';

const seedAdmin = async () => {
  try {
    console.log('🌱 Starting admin seed...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const adminEmail = 'admin@fidelya.com';
    const adminPassword = 'Fidelya10+';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    const adminPasswordHash = await hashPassword(adminPassword);

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Updating password...');
      existingAdmin.passwordHash = adminPasswordHash;
      if (existingAdmin.role !== 'admin') {
         console.log('   Updating role to admin...');
         existingAdmin.role = 'admin';
      }
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully.');
    } else {
      console.log('Creating new admin user...');
      const admin = await User.create({
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: 'admin',
        name: 'System Administrator'
      });
      console.log('✅ Created admin user successfully.');
    }

    console.log(`   Email: ${adminEmail}`);
    // console.log(`   Password: ${adminPassword}\n`); // Security hygiene: avoid printing passwords in logs if possible, but user asked for it clearly.

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Admin seed failed:', error);
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
    }
    process.exit(1);
  }
};

seedAdmin();

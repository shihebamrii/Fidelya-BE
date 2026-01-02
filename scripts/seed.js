import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Business, Client, Item } from '../src/models/index.js';
import { hashPassword } from '../src/services/auth.service.js';
import { generateClientId } from '../src/services/clientId.service.js';
import { generateQRDataUrl } from '../src/services/qrcode.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_DEFAULT_EMAIL });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Skipping seed.');
      console.log(`   Email: ${existingAdmin.email}`);
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeMe123!';
    const adminPasswordHash = await hashPassword(adminPassword);
    
    const admin = await User.create({
      email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@fidelya.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      name: 'System Administrator'
    });
    console.log('✅ Created admin user:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${adminPassword}\n`);

    // Create demo business
    const business = await Business.create({
      name: 'Demo Coffee Shop',
      category: 'Cafe',
      city: 'Paris',
      region: 'Île-de-France',
      contactEmail: 'demo@coffeeshop.com',
      allowNegativePoints: false,
      createdByAdminId: admin._id
    });
    console.log('✅ Created demo business:');
    console.log(`   Name: ${business.name}`);
    console.log(`   ID: ${business._id}\n`);

    // Create business user
    const businessUserPassword = 'Business123!';
    const businessUserPasswordHash = await hashPassword(businessUserPassword);
    
    const businessUser = await User.create({
      email: 'employee@coffeeshop.com',
      passwordHash: businessUserPasswordHash,
      role: 'business_user',
      businessId: business._id,
      name: 'Demo Employee'
    });
    console.log('✅ Created business user:');
    console.log(`   Email: ${businessUser.email}`);
    console.log(`   Password: ${businessUserPassword}\n`);

    // Create demo items
    const items = await Item.create([
      {
        businessId: business._id,
        name: 'Coffee Purchase',
        description: 'Earn points for every coffee purchase',
        points: 10,
        type: 'earn',
        visibleToClient: true
      },
      {
        businessId: business._id,
        name: 'Pastry Purchase',
        description: 'Earn points for pastry purchases',
        points: 5,
        type: 'earn',
        visibleToClient: true
      },
      {
        businessId: business._id,
        name: 'Free Coffee',
        description: 'Redeem for a free coffee',
        points: 100,
        type: 'redeem',
        visibleToClient: true
      },
      {
        businessId: business._id,
        name: 'Free Pastry',
        description: 'Redeem for a free pastry',
        points: 50,
        type: 'redeem',
        visibleToClient: true
      }
    ]);
    console.log('✅ Created demo items:');
    items.forEach(item => {
      console.log(`   - ${item.name} (${item.type}: ${item.points} pts)`);
    });
    console.log();

    // Create demo client
    const clientId = await generateClientId(business._id);
    const client = await Client.create({
      businessId: business._id,
      clientId,
      name: 'John Doe',
      phone: '+33612345678',
      email: 'john.doe@example.com',
      points: 75
    });
    console.log('✅ Created demo client:');
    console.log(`   Name: ${client.name}`);
    console.log(`   Client ID: ${client.clientId}`);
    console.log(`   Points: ${client.points}\n`);

    // Generate QR code
    const qrDataUrl = await generateQRDataUrl(client.clientId);
    
    // Save QR to file
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'demo-client-qr.txt'),
      `Client ID: ${client.clientId}\n\nQR Data URL:\n${qrDataUrl}`
    );
    console.log('✅ QR code saved to: scripts/output/demo-client-qr.txt\n');

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════\n');
    console.log('Login Credentials:');
    console.log('─────────────────');
    console.log(`Admin:    ${admin.email} / ${adminPassword}`);
    console.log(`Employee: ${businessUser.email} / ${businessUserPassword}\n`);
    console.log(`Demo Client Dashboard: ${process.env.CLIENT_DASHBOARD_URL || 'http://localhost:4000/client'}/${client.clientId}`);
    console.log();

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDatabase();

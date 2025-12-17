import mongoose from 'mongoose';
import User from '../models/UserModel.js';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Migration to add fullName, email, phone to existing addresses
const migrateAddresses = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for migration...');

        // Find all users with saved addresses
        const users = await User.find({
            savedAddress: { $exists: true, $ne: [] },
        });

        console.log(`Found ${users.length} users with addresses`);

        let totalMigrated = 0;
        let totalUsers = 0;

        for (const user of users) {
            let hasChanged = false;

            // Iterate through addresses and fill missing fields
            user.savedAddress = user.savedAddress.map((address, idx) => {
                // ✅ If fullName, email, phone don't exist, populate from user data
                if (!address.fullName || !address.email || !address.phone) {
                    hasChanged = true;
                    totalMigrated++;

                    return {
                        ...address.toObject(),
                        fullName: address.fullName || user.name,
                        email: address.email || user.email,
                        phone: address.phone || user.phone,
                        label: address.label || 'Home',
                        isDefault: idx === 0, // First address as default
                    };
                }
                return address;
            });

            // Save if changes were made
            if (hasChanged) {
                await user.save();
                totalUsers++;
                console.log(`✅ Migrated addresses for user: ${user.email}`);
            }
        }

        console.log(`\n🎉 Migration Complete!`);
        console.log(`Updated ${totalUsers} users`);
        console.log(`Migrated ${totalMigrated} addresses`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrateAddresses();

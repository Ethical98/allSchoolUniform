import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = mongoose.Schema(
    {
        // ✅ NEW: Add personal details to address
        fullName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },

        // Existing fields
        address: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
            default: 'Delhi',
        },
        postalCode: {
            type: Number,
            required: true,
        },
        country: {
            type: String,
            required: true,
            default: 'India',
        },

        // ✅ NEW: Metadata
        isDefault: {
            type: Boolean,
            default: false,
        },
        label: {
            type: String,
            enum: ['Home', 'Work', 'Other'],
            default: 'Home',
        },
    },
    { timestamps: true }
);

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            unique: true,
            sparse: true, // Allow null/undefined for OTP-registered users
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: false, // Optional for OTP-registered users
        },
        authMethod: {
            type: String,
            enum: ['password', 'otp'],
            default: 'password',
        },
        isProfileComplete: {
            type: Boolean,
            default: true, // true for password-registered, false for OTP auto-registered
        },
        savedAddress: [addressSchema],
        isAdmin: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// ========================================
// Database Indexes for Query Performance
// ========================================

userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

export default User;

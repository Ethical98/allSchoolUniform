import mongoose from 'mongoose';

const notFoundRequestSchema = mongoose.Schema(
    {
        // Type of request: 'school' or 'product'
        type: {
            type: String,
            enum: ['school', 'product'],
            required: true,
        },

        // Status for admin tracking
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved', 'rejected'],
            default: 'pending',
        },

        // Common fields
        contactName: {
            type: String,
            default: '',
        },
        contactPhone: {
            type: String,
            required: true,
        },
        contactEmail: {
            type: String,
            default: '',
        },
        message: {
            type: String,
            default: '',
        },

        // School-specific fields
        schoolName: {
            type: String,
            required: function () {
                return this.type === 'school';
            },
        },
        schoolCity: {
            type: String,
            default: '',
        },
        schoolState: {
            type: String,
            default: '',
        },

        // Product-specific fields
        productName: {
            type: String,
            default: '',
        },
        productSchool: {
            type: String,
            required: function () {
                return this.type === 'product';
            },
        },
        productType: {
            type: String,
            default: '',
        },
        productSize: {
            type: String,
            default: '',
        },

        // Tracking
        resolvedAt: {
            type: Date,
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        adminNotes: {
            type: String,
            default: '',
        },

        // User who submitted (optional - for logged in users)
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },

        // Email notification tracking
        emailSent: {
            type: Boolean,
            default: false,
        },
        emailSentAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
notFoundRequestSchema.index({ type: 1, status: 1, createdAt: -1 });
notFoundRequestSchema.index({ contactPhone: 1 });

const NotFoundRequest = mongoose.model('NotFoundRequest', notFoundRequestSchema);

export default NotFoundRequest;

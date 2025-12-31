import asyncHandler from 'express-async-handler';
import NotFoundRequest from '../models/NotFoundRequestModel.js';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

// Email configuration
const ADMIN_EMAILS = [
    'devansh@allschooluniform.com',
];

// Create OAuth2 client for Gmail
const createOAuth2Transporter = async () => {
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            'https://developers.google.com/oauthplayground'
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN,
        });

        const accessToken = await oauth2Client.getAccessToken();

        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.GMAIL_USER || 'noreply@allschooluniform.com',
                clientId: process.env.GMAIL_CLIENT_ID,
                clientSecret: process.env.GMAIL_CLIENT_SECRET,
                refreshToken: process.env.GMAIL_REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });
    } catch (error) {
        console.error('[Email] OAuth2 setup failed:', error);
        return null;
    }
};

// Fallback to SMTP transport (App Password)
const createSMTPTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

// Get email transporter (OAuth2 preferred, SMTP fallback)
const getEmailTransporter = async () => {
    // Debug: Log which credentials are available
    console.log('[Email Debug] Checking credentials...');
    console.log('[Email Debug] GMAIL_CLIENT_ID:', process.env.GMAIL_CLIENT_ID ? 'SET' : 'NOT SET');
    console.log('[Email Debug] GMAIL_REFRESH_TOKEN:', process.env.GMAIL_REFRESH_TOKEN ? 'SET' : 'NOT SET');
    console.log('[Email Debug] SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET');
    console.log('[Email Debug] SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');

    // Try OAuth2 first if credentials exist
    if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_REFRESH_TOKEN) {
        const oauth2Transport = await createOAuth2Transporter();
        if (oauth2Transport) {
            console.log('[Email] Using OAuth2 transport');
            return oauth2Transport;
        }
    }

    // Fall back to SMTP
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log('[Email] Using SMTP transport');
        return createSMTPTransporter();
    }

    console.warn('[Email] No email credentials configured');
    return null;
};



const sendNotificationEmail = async (request) => {
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const isSchool = request.type === 'school';
        const subject = isSchool
            ? `New School Request: ${request.schoolName}`
            : `New Product Request: ${request.productSchool}`;


        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 20px; border-radius: 12px 12px 0 0;">
                    <h2 style="color: white; margin: 0;">${isSchool ? '🏫 School Not Found Request' : '📦 Product Not Found Request'}</h2>
                </div>
                
                <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                    ${isSchool ? `
                        <h3 style="color: #374151; margin-top: 0;">School Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">School Name:</td><td style="color: #111827; font-weight: 500;">${request.schoolName}</td></tr>
                            <tr><td style="padding: 8px 0; color: #6b7280;">City:</td><td style="color: #111827;">${request.schoolCity || 'Not specified'}</td></tr>
                            <tr><td style="padding: 8px 0; color: #6b7280;">State:</td><td style="color: #111827;">${request.schoolState || 'Not specified'}</td></tr>
                        </table>
                    ` : `
                        <h3 style="color: #374151; margin-top: 0;">Product Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">School:</td><td style="color: #111827; font-weight: 500;">${request.productSchool}</td></tr>
                            <tr><td style="padding: 8px 0; color: #6b7280;">Product Type:</td><td style="color: #111827;">${request.productType || 'Not specified'}</td></tr>
                            <tr><td style="padding: 8px 0; color: #6b7280;">Product Name:</td><td style="color: #111827;">${request.productName || 'Not specified'}</td></tr>
                            <tr><td style="padding: 8px 0; color: #6b7280;">Size:</td><td style="color: #111827;">${request.productSize || 'Not specified'}</td></tr>
                        </table>
                    `}
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    
                    <h3 style="color: #374151;">Contact Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Name:</td><td style="color: #111827;">${request.contactName || 'Not provided'}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6b7280;">Phone:</td><td style="color: #111827; font-weight: 500;">${request.contactPhone}</td></tr>
                        ${request.contactEmail ? `<tr><td style="padding: 8px 0; color: #6b7280;">Email:</td><td style="color: #111827;">${request.contactEmail}</td></tr>` : ''}
                    </table>
                    
                    ${request.message ? `
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                        <h3 style="color: #374151;">Additional Message</h3>
                        <p style="color: #374151; background: white; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">${request.message}</p>
                    ` : ''}
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    
                    <p style="color: #6b7280; font-size: 12px; margin: 0;">
                        Request ID: ${request._id}<br>
                        Submitted at: ${new Date(request.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                </div>
            </div>
        `;

        const fromEmail = process.env.GMAIL_USER;
        
        // Create RFC 2822 formatted email
        const email = [
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `From: "All School Uniform" <${fromEmail}>`,
            `To: ${ADMIN_EMAILS.join(', ')}`,
            `Subject: ${subject}`,
            '',
            htmlContent
        ].join('\n');

        // Base64 URL-safe encode
        const encodedEmail = Buffer.from(email)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // Send via Gmail API
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedEmail
            }
        });

        // Update email sent status
        await NotFoundRequest.findByIdAndUpdate(request._id, {
            emailSent: true,
            emailSentAt: new Date(),
        });

        console.log(`[NotFound] Email sent via Gmail API for request ${request._id}`);
        return true;
    } catch (error) {
        console.error('[NotFound] Email API error:', error.message);
        if (error.response) {
            console.error('[NotFound] API response:', error.response.data);
        }
        return false;
    }
};


// @desc Submit school not found request
// @route POST /api/requests/school
// @access Public
const submitSchoolRequest = asyncHandler(async (req, res) => {
    const { schoolName, city, state, contactName, contactPhone, contactEmail, message } = req.body;

    if (!schoolName || !contactPhone) {
        res.status(400);
        throw new Error('School name and phone number are required');
    }

    const request = await NotFoundRequest.create({
        type: 'school',
        schoolName,
        schoolCity: city,
        schoolState: state,
        contactName,
        contactPhone,
        contactEmail,
        message,
        submittedBy: req.user?._id,
    });

    // Send email notification (async, don't block response)
    sendNotificationEmail(request);

    res.status(201).json({
        success: true,
        message: 'Request submitted successfully',
        requestId: request._id,
    });
});

// @desc Submit product not found request
// @route POST /api/requests/product
// @access Public
const submitProductRequest = asyncHandler(async (req, res) => {
    const { schoolName, productType, productName, size, contactName, contactPhone, contactEmail, message } = req.body;

    if (!schoolName || !contactPhone) {
        res.status(400);
        throw new Error('School name and phone number are required');
    }

    const request = await NotFoundRequest.create({
        type: 'product',
        productSchool: schoolName,
        productType,
        productName,
        productSize: size,
        contactName,
        contactPhone,
        contactEmail,
        message,
        submittedBy: req.user?._id,
    });

    // Send email notification (async, don't block response)
    sendNotificationEmail(request);

    res.status(201).json({
        success: true,
        message: 'Request submitted successfully',
        requestId: request._id,
    });
});

// @desc Get all not found requests (admin)
// @route GET /api/requests
// @access Private/Admin
const getAllRequests = asyncHandler(async (req, res) => {
    const { type, status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = {};

    if (type && ['school', 'product'].includes(type)) {
        filter.type = type;
    }

    if (status && ['pending', 'reviewed', 'resolved', 'rejected'].includes(status)) {
        filter.status = status;
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [requests, total] = await Promise.all([
        NotFoundRequest.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('submittedBy', 'name email phone')
            .populate('resolvedBy', 'name email')
            .lean(),
        NotFoundRequest.countDocuments(filter),
    ]);

    res.json({
        success: true,
        requests,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
        },
        stats: {
            pending: await NotFoundRequest.countDocuments({ status: 'pending' }),
            reviewed: await NotFoundRequest.countDocuments({ status: 'reviewed' }),
            resolved: await NotFoundRequest.countDocuments({ status: 'resolved' }),
        },
    });
});

// @desc Get single request by ID (admin)
// @route GET /api/requests/:id
// @access Private/Admin
const getRequestById = asyncHandler(async (req, res) => {
    const request = await NotFoundRequest.findById(req.params.id)
        .populate('submittedBy', 'name email phone')
        .populate('resolvedBy', 'name email');

    if (!request) {
        res.status(404);
        throw new Error('Request not found');
    }

    res.json({
        success: true,
        request,
    });
});

// @desc Update request status (admin)
// @route PUT /api/requests/:id/status
// @access Private/Admin
const updateRequestStatus = asyncHandler(async (req, res) => {
    const { status, adminNotes } = req.body;

    if (!status || !['pending', 'reviewed', 'resolved', 'rejected'].includes(status)) {
        res.status(400);
        throw new Error('Valid status is required');
    }

    const request = await NotFoundRequest.findById(req.params.id);

    if (!request) {
        res.status(404);
        throw new Error('Request not found');
    }

    request.status = status;

    if (adminNotes !== undefined) {
        request.adminNotes = adminNotes;
    }

    if (status === 'resolved') {
        request.resolvedAt = new Date();
        request.resolvedBy = req.user._id;
    }

    await request.save();

    res.json({
        success: true,
        message: 'Status updated successfully',
        request,
    });
});

// @desc Delete request (admin)
// @route DELETE /api/requests/:id
// @access Private/Admin
const deleteRequest = asyncHandler(async (req, res) => {
    const request = await NotFoundRequest.findById(req.params.id);

    if (!request) {
        res.status(404);
        throw new Error('Request not found');
    }

    await NotFoundRequest.deleteOne({ _id: req.params.id });

    res.json({
        success: true,
        message: 'Request deleted successfully',
    });
});

export {
    submitSchoolRequest,
    submitProductRequest,
    getAllRequests,
    getRequestById,
    updateRequestStatus,
    deleteRequest,
};

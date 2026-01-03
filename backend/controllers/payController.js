import asyncHandler from 'express-async-handler';
import Crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/OrderModel.js';
import User from '../models/UserModel.js';
import dotenv from 'dotenv';
import { RedisService } from '../services/redisService.js';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';

dotenv.config();

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_SALT,
});



// ✅ Redis replaces in-memory Maps for production-ready persistence
// - Payment data and webhook status are now stored in Redis
// - Automatic TTL-based cleanup (30 minutes)
// - Survives server restarts
// - Supports horizontal scaling

// ✅ Create Razorpay Order
// @desc Create payment order
// @route POST /api/pay/createOrder
// @access Private
const createPaymentOrder = asyncHandler(async (req, res) => {
    const {
        amount,
        currency = 'INR',
        orderId,
        orderItems,
        shippingAddress,
        itemsPrice,
        taxPrice,
        totalPrice,
    } = req.body;

    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error('Invalid amount');
    }

    // ✅ Validate order data (needed for webhook to create order)
    if (!orderItems || !shippingAddress) {
        res.status(400);
        throw new Error('Order items and shipping address are required');
    }

    try {
        const options = {
            amount: Math.round(amount * 100), // Razorpay uses paise
            currency,
            receipt: `order_${Date.now()}`,
            notes: {
                orderId,
                userId: req.user._id.toString(),
                itemsCount: orderItems?.length || 0,
            },
        };

        const order = await razorpayInstance.orders.create(options);

        console.log('[Payment] Order created:', order.id);

        // ✅ Store order data in Redis for webhook to use
        await RedisService.storePaymentData(order.id, {
            orderData: {
                orderItems,
                shippingAddress,
                itemsPrice,
                taxPrice,
                shippingPrice: 0,
                totalPrice,
            },
            userId: req.user._id.toString(),
            userName: req.user.name,
            userPhone: req.user.phone,
            timestamp: Date.now(),
        });

        console.log('[Payment] Order data stored in Redis for webhook processing');

        // ✅ Initialize webhook status as pending in Redis
        await RedisService.setWebhookStatus(order.id, {
            status: 'pending',
            razorpayOrderId: order.id,
        });

        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount / 100, // Convert back to rupees for frontend
            currency: order.currency,
            createdAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Payment] Error creating order:', error.message);
        res.status(500);
        throw new Error('Failed to create payment order');
    }
});

// ✅ Verify Payment & Create/Update Order
// @desc Verify Razorpay payment and create order (used as fallback when webhook times out)
// @route POST /api/pay/verifyPayment
// @access Private
const verifyPayment = asyncHandler(async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderData,
    } = req.body;

    console.log('[Payment] Verification request received:', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
    });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        res.status(400);
        throw new Error('Missing payment verification data');
    }

    try {
        // ✅ Check if order already exists (prevent duplicates from webhook + fallback verification)
        const existingOrder = await Order.findOne({
            razorpayOrderId: razorpay_order_id,
        });

        if (existingOrder) {
            console.log(
                '[Payment] ✅ Order already exists (webhook processed):',
                existingOrder._id
            );

            // ✅ Update webhook status to completed in Redis (in case it wasn't)
            await RedisService.setWebhookStatus(razorpay_order_id, {
                status: 'completed',
                razorpayOrderId: razorpay_order_id,
                orderId: existingOrder._id.toString(),
                paymentId: razorpay_payment_id,
            });

            // Return existing order data
            return res.status(200).json({
                success: true,
                message: 'Payment already verified (order exists)',
                orderId: existingOrder._id,
                paymentId: razorpay_payment_id,
                orderData: {
                    _id: existingOrder._id,
                    orderNumber: existingOrder.orderNumber,
                    totalPrice: existingOrder.totalPrice,
                    createdAt: existingOrder.createdAt,
                },
            });
        }

        console.log(
            '[Payment] No existing order found. Proceeding with verification...'
        );

        // ✅ Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = Crypto.createHmac(
            'sha256',
            process.env.RAZORPAY_SALT
        )
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.error(
                '[Payment] ❌ Signature mismatch - verification failed'
            );

            // ✅ Update webhook status to failed in Redis
            await RedisService.setWebhookStatus(razorpay_order_id, {
                status: 'failed',
                razorpayOrderId: razorpay_order_id,
                errorMessage:
                    'Payment verification failed - signature mismatch',
            });

            res.status(400);
            throw new Error('Payment verification failed - signature mismatch');
        }

        console.log('[Payment] ✅ Signature verified successfully');

        // ✅ Fetch payment details from Razorpay
        console.log('[Payment] Fetching payment details from Razorpay...');
        const payment = await razorpayInstance.payments.fetch(
            razorpay_payment_id
        );

        console.log('[Payment] Razorpay payment status:', payment.status);

        if (payment.status !== 'captured') {
            console.error(
                '[Payment] ❌ Payment not captured. Status:',
                payment.status
            );

            // ✅ Update webhook status to failed in Redis
            await RedisService.setWebhookStatus(razorpay_order_id, {
                status: 'failed',
                razorpayOrderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                errorMessage: `Payment not captured - status: ${payment.status}`,
            });

            res.status(400);
            throw new Error(
                `Payment not captured. Current status: ${payment.status}`
            );
        }

        console.log(
            '[Payment] ✅ Payment captured. Creating order in database...'
        );

        // ✅ Validate orderData
        if (!orderData || !orderData.orderItems || !orderData.shippingAddress) {
            console.error('[Payment] ❌ Invalid order data structure');
            res.status(400);
            throw new Error('Invalid order data - missing required fields');
        }

        // ✅ Create order - Same structure as COD orders
        const order = new Order({
            orderItems: orderData.orderItems,
            user: req.user._id,
            name: req.user.name,
            phone: req.user.phone,
            shippingAddress: orderData.shippingAddress,
            paymentMethod: 'online',
            paymentStatus: 'paid',
            isPaid: true,
            paidAt: new Date(),
            itemsPrice: orderData.itemsPrice,
            taxPrice: orderData.taxPrice,
            shippingPrice: orderData.shippingPrice || 0,
            totalPrice: orderData.totalPrice,
            orderStatus: `Received: ${Date.now()}`,
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
        });

        const savedOrder = await order.save();

        console.log('[Payment] ✅ Order created successfully:', {
            orderId: savedOrder._id,
            orderNumber: savedOrder.orderNumber,
            totalPrice: savedOrder.totalPrice,
        });

        // ✅ Send order confirmation email (non-blocking)
        sendOrderConfirmationEmail(savedOrder, req.user).catch(error => {
            console.error('[Payment] Email sending failed (non-blocking):', error.message);
        });

        // ✅ Update webhook status to completed in Redis
        await RedisService.setWebhookStatus(razorpay_order_id, {
            status: 'completed',
            razorpayOrderId: razorpay_order_id,
            orderId: savedOrder._id.toString(),
            paymentId: razorpay_payment_id,
        });

        console.log(
            '[Payment] Webhook status updated to completed for order:',
            razorpay_order_id
        );

        res.status(201).json({
            success: true,
            message: 'Payment verified and order created',
            orderId: savedOrder._id,
            paymentId: razorpay_payment_id,
            orderData: {
                _id: savedOrder._id,
                orderNumber: savedOrder.orderNumber,
                totalPrice: savedOrder.totalPrice,
                createdAt: savedOrder.createdAt,
            },
        });
    } catch (error) {
        console.error('[Payment] ❌ Verification error:', {
            message: error.message,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
        });
        res.status(400);
        throw new Error(error.message);
    }
});

// ✅ Get Webhook Status
// @desc Poll webhook processing status
// @route GET /api/pay/webhook/status
// @access Private
const getWebhookStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.query;

    console.log('[Webhook Status] Polling request received for:', orderId);

    if (!orderId) {
        res.status(400);
        throw new Error('Order ID is required');
    }

    try {
        // ✅ Check if webhook status exists in Redis
        const webhookStatus = await RedisService.getWebhookStatus(orderId);
        console.log('[Webhook Status] Redis status:', webhookStatus || 'NOT FOUND');

        if (!webhookStatus) {
            // ✅ Check if order exists in database (fallback)
            console.log('[Webhook Status] Checking database for order...');
            const order = await Order.findOne({ razorpayOrderId: orderId });

            if (order) {
                console.log('[Webhook Status] ✅ Order found in database:', {
                    orderId: order._id.toString(),
                    paymentId: order.razorpayPaymentId,
                    orderNumber: order.orderNumber,
                });

                res.json({
                    success: true,
                    status: 'completed',
                    orderId: order._id.toString(),
                    paymentId: order.razorpayPaymentId,
                });
                return;
            }

            // ✅ No status found - still pending
            console.log('[Webhook Status] No order found - status: pending');
            res.json({
                success: true,
                status: 'pending',
            });
            return;
        }

        // ✅ Return webhook status from Redis
        console.log('[Webhook Status] Returning status:', {
            status: webhookStatus.status,
            orderId: webhookStatus.orderId,
            paymentId: webhookStatus.paymentId,
            hasError: !!webhookStatus.errorMessage,
        });

        res.json({
            success: true,
            status: webhookStatus.status,
            orderId: webhookStatus.orderId,
            paymentId: webhookStatus.paymentId,
            errorMessage: webhookStatus.errorMessage,
        });
    } catch (error) {
        console.error('[Webhook Status] ❌ Error:', error.message);
        res.status(500);
        throw new Error('Failed to fetch webhook status');
    }
});

// ✅ Handle Failed Payment - Create COD Order
// @desc Create order with COD if payment fails
// @route POST /api/pay/paymentFailed
// @access Private
const handlePaymentFailure = asyncHandler(async (req, res) => {
    const { razorpay_payment_id, error_code, error_description, orderData } =
        req.body;

    try {
        console.log('[PaymentFailed] Creating COD order after failed payment');

        // ✅ Validate orderData
        if (!orderData || !orderData.orderItems || !orderData.shippingAddress) {
            res.status(400);
            throw new Error('Invalid order data');
        }

        // ✅ Save payment failure details
        const failureData = {
            razorpayPaymentId: razorpay_payment_id,
            errorCode: error_code,
            errorDescription: error_description,
            failedAt: new Date().toISOString(),
        };

        // ✅ Create order with COD & payment failure info
        const order = new Order({
            orderItems: orderData.orderItems,
            user: req.user._id,
            name: req.user.name,
            phone: req.user.phone,
            shippingAddress: orderData.shippingAddress,
            paymentMethod: orderData.paymentMethod || 'COD',
            paymentStatus: 'pending',
            itemsPrice: orderData.itemsPrice,
            taxPrice: orderData.taxPrice,
            shippingPrice: orderData.shippingPrice || 0,
            totalPrice: orderData.totalPrice,
            paymentFailure: failureData,
            orderStatus: `Received: ${Date.now()}`,
        });

        const savedOrder = await order.save();

        console.log('[PaymentFailed] COD order created:', savedOrder._id);

        res.status(201).json({
            success: true,
            message: 'Order created with Cash on Delivery',
            _id: savedOrder._id,
            orderNumber: savedOrder.orderNumber,
            status: savedOrder.orderStatus,
            paymentMethod: 'COD',
            createdAt: savedOrder.createdAt,
            paymentFailureDetails: failureData,
        });
    } catch (error) {
        console.error('[PaymentFailed] Error:', error.message);
        res.status(500);
        throw new Error('Failed to create fallback order');
    }
});

// ✅ Refund Payment
// @desc Refund payment if order creation fails
// @route POST /api/pay/refund
// @access Private
const refundPayment = asyncHandler(async (req, res) => {
    const { razorpay_payment_id, amount, reason } = req.body;

    if (!razorpay_payment_id || !amount) {
        res.status(400);
        throw new Error('Missing refund data');
    }

    try {
        console.log(
            `[Refund] Initiating refund for payment ${razorpay_payment_id}`
        );

        // ✅ Check if payment exists and is captured
        const payment = await razorpayInstance.payments.fetch(
            razorpay_payment_id
        );

        if (payment.status !== 'captured') {
            console.error(
                '[Refund] Payment not in captured state:',
                payment.status
            );
            res.status(400);
            throw new Error(
                'Payment cannot be refunded - not in captured state'
            );
        }

        // ✅ Create refund
        const refund = await razorpayInstance.payments.refund(
            razorpay_payment_id,
            {
                amount: Math.round(amount * 100), // Convert to paise
                notes: {
                    reason: reason || 'Order refund',
                    userId: req.user._id.toString(),
                    timestamp: new Date().toISOString(),
                },
            }
        );

        console.log('[Refund] Refund created:', refund.id);

        res.status(200).json({
            success: true,
            message: 'Refund initiated successfully',
            refundId: refund.id,
            status: refund.status,
            amount: refund.amount / 100, // Convert back to rupees
        });
    } catch (error) {
        console.error('[Refund] Error:', error.message);
        res.status(500);
        throw new Error(`Refund failed: ${error.message}`);
    }
});

// ✅ Webhook Handler for Razorpay Events
// @desc Handle Razorpay webhook events
// @route POST /api/pay/webhook
// @access Public (but verify signature)
const handlePaymentWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.rawBody;

    try {
        if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
            console.error('[Webhook] ❌ CRITICAL: RAZORPAY_WEBHOOK_SECRET is not defined in environment variables');
            return res.status(500).json({ success: false, message: 'Server configuration error' });
        }

        // 🔍 DEBUG: Log values for troubleshooting
        console.log('[Webhook] 🔍 DEBUG - Webhook Secret from .env:', process.env.RAZORPAY_WEBHOOK_SECRET);
        console.log('[Webhook] 🔍 DEBUG - Received signature:', signature);
        console.log('[Webhook] 🔍 DEBUG - Raw body length:', body?.length, 'bytes');
        console.log('[Webhook] 🔍 DEBUG - Raw body type:', typeof body);

        // ✅ Verify webhook signature using Razorpay Webhook Secret (from Dashboard → Webhooks)
        const expectedSignature = Crypto.createHmac(
            'sha256',
            process.env.RAZORPAY_WEBHOOK_SECRET
        )
            .update(body)
            .digest('hex');

        console.log('[Webhook] 🔍 DEBUG - Expected signature:', expectedSignature);

        if (expectedSignature !== signature) {
            console.error('[Webhook] ❌ Invalid signature');
            console.error('[Webhook] ❌ Signature mismatch - Expected:', expectedSignature, 'Got:', signature);
            return res
                .status(400)
                .json({ success: false, message: 'Invalid signature' });
        }

        const event = req.body.event;
        const paymentData = req.body.payload?.payment?.entity;
        // ✅ FIX: order_id is inside paymentData, NOT in a separate order entity
        const razorpayOrderId = paymentData?.order_id;



        switch (event) {
            case 'payment.authorized':
                console.log(
                    '[Webhook] Payment authorized:',
                    paymentData?.id
                );

                if (razorpayOrderId) {
                    await RedisService.setWebhookStatus(razorpayOrderId, {
                        status: 'pending',
                        razorpayOrderId: razorpayOrderId,
                        paymentId: paymentData?.id,
                    });
                }
                break;

            case 'payment.failed':
                console.log('[Webhook] Payment failed:', paymentData?.id);

                if (razorpayOrderId) {
                    await RedisService.setWebhookStatus(razorpayOrderId, {
                        status: 'failed',
                        razorpayOrderId: razorpayOrderId,
                        paymentId: paymentData?.id,
                        errorMessage:
                            paymentData?.error_description ||
                            'Payment failed',
                    });

                    // Clean up pending order data from Redis
                    await RedisService.deletePaymentData(razorpayOrderId);
                }
                break;

            case 'payment.captured':
                console.log('[Webhook] Payment captured:', paymentData?.id);

                if (razorpayOrderId && paymentData?.id) {
                    try {
                        // ✅ Check if order already exists (prevent duplicates)
                        const existingOrder = await Order.findOne({
                            razorpayOrderId: razorpayOrderId,
                        });

                        if (existingOrder) {
                            console.log(
                                '[Webhook] ✅ Order already exists:',
                                existingOrder._id
                            );

                            // Update webhook status in Redis
                            await RedisService.setWebhookStatus(razorpayOrderId, {
                                status: 'completed',
                                razorpayOrderId: razorpayOrderId,
                                orderId: existingOrder._id.toString(),
                                paymentId: paymentData.id,
                            });

                            // Clean up pending data from Redis
                            await RedisService.deletePaymentData(razorpayOrderId);
                            break;
                        }

                        // ✅ Get stored order data from Redis
                        const pendingData = await RedisService.getPaymentData(
                            razorpayOrderId
                        );

                        if (!pendingData) {
                            console.error(
                                '[Webhook] ❌ No pending order data found in Redis for:',
                                razorpayOrderId
                            );
                            console.log(
                                '[Webhook] Order will be created via fallback verification'
                            );

                            // Keep status as pending so fallback verification can handle it
                            await RedisService.setWebhookStatus(razorpayOrderId, {
                                status: 'pending',
                                razorpayOrderId: razorpayOrderId,
                                paymentId: paymentData.id,
                            });
                            break;
                        }

                        console.log(
                            '[Webhook] ✅ Creating order in database from webhook...'
                        );

                        // ✅ Create order in database
                        const order = new Order({
                            orderItems: pendingData.orderData.orderItems,
                            user: pendingData.userId,
                            name: pendingData.userName,
                            phone: pendingData.userPhone,
                            shippingAddress:
                                pendingData.orderData.shippingAddress,
                            paymentMethod: 'online',
                            paymentStatus: 'paid',
                            isPaid: true,
                            paidAt: new Date(),
                            itemsPrice: pendingData.orderData.itemsPrice,
                            taxPrice: pendingData.orderData.taxPrice,
                            shippingPrice:
                                pendingData.orderData.shippingPrice || 0,
                            totalPrice: pendingData.orderData.totalPrice,
                            orderStatus: `Received: ${Date.now()}`,
                            razorpayPaymentId: paymentData.id,
                            razorpayOrderId: razorpayOrderId,
                        });

                        const savedOrder = await order.save();

                        console.log(
                            '[Webhook] ✅ Order created successfully:',
                            {
                                orderId: savedOrder._id,
                                orderNumber: savedOrder.orderNumber,
                                razorpayOrderId: razorpayOrderId,
                            }
                        );

                        // ✅ Send order confirmation email (non-blocking)
                        // Fetch user for email sending
                        const user = await User.findById(pendingData.userId);
                        if (user) {
                            sendOrderConfirmationEmail(savedOrder, user).catch(error => {
                                console.error('[Webhook] Email sending failed (non-blocking):', error.message);
                            });
                        }

                        // ✅ Update webhook status to completed in Redis
                        await RedisService.setWebhookStatus(razorpayOrderId, {
                            status: 'completed',
                            razorpayOrderId: razorpayOrderId,
                            orderId: savedOrder._id.toString(),
                            paymentId: paymentData.id,
                        });

                        // ✅ Clean up pending data from Redis
                        await RedisService.deletePaymentData(razorpayOrderId);

                        console.log(
                            '[Webhook] Webhook status updated to completed'
                        );
                    } catch (error) {
                        console.error(
                            '[Webhook] ❌ Error creating order:',
                            error.message
                        );

                        // Mark as pending so fallback verification can retry
                        await RedisService.setWebhookStatus(razorpayOrderId, {
                            status: 'pending',
                            razorpayOrderId: razorpayOrderId,
                            paymentId: paymentData?.id,
                        });
                    }
                }
                break;

            case 'refund.created':
                console.log('[Webhook] Refund created:', paymentData?.id);
                // Handle refund creation if needed
                break;

            default:
                console.log('[Webhook] Unhandled event:', event);
        }

        res.status(200).json({ success: true, message: 'Webhook processed' });
    } catch (error) {
        console.log(error, "error")
        console.error('[Webhook] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

export {
    createPaymentOrder,
    verifyPayment,
    getWebhookStatus,
    handlePaymentFailure,
    refundPayment,
    handlePaymentWebhook,
};

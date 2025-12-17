import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Initialize Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    connectTimeout: 10000,
});

// ✅ Connection event handlers
redis.on('connect', () => {
    console.log('[Redis] ✅ Connected to Redis server');
});

redis.on('ready', () => {
    console.log('[Redis] ✅ Redis client ready');
});

redis.on('error', (err) => {
    console.error('[Redis] ❌ Redis connection error:', err.message);
});

redis.on('close', () => {
    console.log('[Redis] Connection closed');
});

redis.on('reconnecting', () => {
    console.log('[Redis] Reconnecting...');
});

// ✅ Key prefixes for organization
const KEYS = {
    PAYMENT: 'payment:', // payment:{razorpayOrderId} -> pending order data
    WEBHOOK: 'webhook:', // webhook:{razorpayOrderId} -> webhook status
};

// ✅ Default TTL: 30 minutes (same as previous in-memory cleanup interval)
const DEFAULT_TTL = 30 * 60; // 1800 seconds

/**
 * Redis Service for Payment Operations
 * Replaces in-memory Maps with Redis for:
 * - Persistence across server restarts
 * - Horizontal scaling support
 * - Automatic TTL-based cleanup
 */
export const RedisService = {
    /**
     * Store pending payment/order data when Razorpay order is created
     * @param {string} razorpayOrderId - Razorpay order ID
     * @param {Object} data - Order data including orderItems, shippingAddress, userId, etc.
     * @param {number} ttl - Time to live in seconds (default: 30 minutes)
     */
    async storePaymentData(razorpayOrderId, data, ttl = DEFAULT_TTL) {
        try {
            const key = `${KEYS.PAYMENT}${razorpayOrderId}`;
            await redis.setex(key, ttl, JSON.stringify(data));
            console.log(`[Redis] Payment data stored for: ${razorpayOrderId}`);
        } catch (error) {
            console.error('[Redis] ❌ Error storing payment data:', error.message);
            throw error;
        }
    },

    /**
     * Retrieve pending payment/order data
     * @param {string} razorpayOrderId - Razorpay order ID
     * @returns {Object|null} - Payment data or null if not found/expired
     */
    async getPaymentData(razorpayOrderId) {
        try {
            const key = `${KEYS.PAYMENT}${razorpayOrderId}`;
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('[Redis] ❌ Error getting payment data:', error.message);
            throw error;
        }
    },

    /**
     * Delete payment data after order is created
     * @param {string} razorpayOrderId - Razorpay order ID
     */
    async deletePaymentData(razorpayOrderId) {
        try {
            const key = `${KEYS.PAYMENT}${razorpayOrderId}`;
            await redis.del(key);
            console.log(`[Redis] Payment data deleted for: ${razorpayOrderId}`);
        } catch (error) {
            console.error('[Redis] ❌ Error deleting payment data:', error.message);
            throw error;
        }
    },

    /**
     * Set webhook processing status
     * @param {string} razorpayOrderId - Razorpay order ID
     * @param {Object} status - Status object with status, orderId, paymentId, etc.
     * @param {number} ttl - Time to live in seconds (default: 30 minutes)
     */
    async setWebhookStatus(razorpayOrderId, status, ttl = DEFAULT_TTL) {
        try {
            const key = `${KEYS.WEBHOOK}${razorpayOrderId}`;
            const statusWithTimestamp = {
                ...status,
                timestamp: Date.now(),
            };
            await redis.setex(key, ttl, JSON.stringify(statusWithTimestamp));
            console.log(
                `[Redis] Webhook status set for ${razorpayOrderId}: ${status.status}`
            );
        } catch (error) {
            console.error('[Redis] ❌ Error setting webhook status:', error.message);
            throw error;
        }
    },

    /**
     * Get webhook processing status
     * @param {string} razorpayOrderId - Razorpay order ID
     * @returns {Object|null} - Webhook status or null if not found/expired
     */
    async getWebhookStatus(razorpayOrderId) {
        try {
            const key = `${KEYS.WEBHOOK}${razorpayOrderId}`;
            const status = await redis.get(key);
            return status ? JSON.parse(status) : null;
        } catch (error) {
            console.error('[Redis] ❌ Error getting webhook status:', error.message);
            throw error;
        }
    },

    /**
     * Delete webhook status (cleanup after completion)
     * @param {string} razorpayOrderId - Razorpay order ID
     */
    async deleteWebhookStatus(razorpayOrderId) {
        try {
            const key = `${KEYS.WEBHOOK}${razorpayOrderId}`;
            await redis.del(key);
            console.log(`[Redis] Webhook status deleted for: ${razorpayOrderId}`);
        } catch (error) {
            console.error(
                '[Redis] ❌ Error deleting webhook status:',
                error.message
            );
            throw error;
        }
    },

    /**
     * Health check - verify Redis connection
     * @returns {boolean} - true if connected, false otherwise
     */
    async isHealthy() {
        try {
            const result = await redis.ping();
            return result === 'PONG';
        } catch (error) {
            console.error('[Redis] ❌ Health check failed:', error.message);
            return false;
        }
    },

    /**
     * Graceful shutdown - close Redis connection
     */
    async disconnect() {
        try {
            await redis.quit();
            console.log('[Redis] Connection closed gracefully');
        } catch (error) {
            console.error('[Redis] ❌ Error during disconnect:', error.message);
            throw error;
        }
    },
};

// Export the raw redis client for advanced use cases (if needed)
export { redis };

export default RedisService;

import axios from 'axios';
import { redis } from '../../../services/redisService.js';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_KEY = 'shipping:token';
const TOKEN_TTL = 9 * 24 * 60 * 60; // 9 days in seconds (token valid for 10 days)
const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

/**
 * Get a valid shipping provider token.
 * Checks Redis cache first, falls back to login API if missing/expired.
 */
export const getToken = async () => {
  try {
    // Try Redis first
    const cached = await redis.get(REDIS_KEY);
    if (cached) {
      return cached;
    }
  } catch (err) {
    console.error('[Shipping Token] Redis read failed, will fetch fresh token:', err.message);
  }

  // Cache miss or Redis error — fetch new token
  return await refreshToken();
};

/**
 * Force refresh the token (called on 401 or cache miss).
 */
export const refreshToken = async () => {
  const { data } = await axios.post(`${BASE_URL}/auth/login`, {
    email: process.env.SHIPPING_API_EMAIL,
    password: process.env.SHIPPING_API_PASSWORD,
  });

  const token = data.token;
  if (!token) {
    throw new Error('Shipping provider login failed: no token returned');
  }

  // Cache in Redis
  try {
    await redis.setex(REDIS_KEY, TOKEN_TTL, token);
    console.log('[Shipping Token] Token cached in Redis');
  } catch (err) {
    console.error('[Shipping Token] Redis write failed:', err.message);
  }

  return token;
};

export default { getToken, refreshToken };

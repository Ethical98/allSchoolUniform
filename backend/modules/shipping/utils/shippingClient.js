import axios from 'axios';
import { getToken, refreshToken } from '../services/shippingTokenService.js';
import ShippingLog from '../models/ShippingLogModel.js';

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

/**
 * Create an axios instance for the shipping provider API.
 * Auto-injects Bearer token, retries on 401, and logs all calls.
 */
const createClient = () => {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Request interceptor: inject token
  client.interceptors.request.use(async (config) => {
    const token = await getToken();
    config.headers.Authorization = `Bearer ${token}`;
    config._startTime = Date.now();
    return config;
  });

  // Response interceptor: handle 401 retry
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Retry once on 401 (token expired)
      if (error.response?.status === 401 && !originalRequest._retried) {
        originalRequest._retried = true;
        const newToken = await refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      }

      return Promise.reject(error);
    }
  );

  return client;
};

const client = createClient();

/**
 * Make an API call with automatic logging.
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint path (relative to base URL)
 * @param {Object} options - { data, params, action, orderId, asuOrderId, source }
 */
export const shippingApi = async (method, endpoint, options = {}) => {
  const { data, params, action = 'UNKNOWN', orderId, asuOrderId, source = 'admin' } = options;
  const startTime = Date.now();

  try {
    const response = await client({
      method,
      url: endpoint,
      data,
      params,
    });

    // Log successful call
    await ShippingLog.create({
      orderId,
      asuOrderId,
      action,
      endpoint: `${method.toUpperCase()} ${endpoint}`,
      requestPayload: data || params,
      responsePayload: response.data,
      statusCode: response.status,
      success: true,
      duration: Date.now() - startTime,
      source,
    }).catch((err) => console.error('[ShippingLog] Write failed:', err.message));

    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.message || error.response?.data?.errors || error.message;

    // Log failed call
    await ShippingLog.create({
      orderId,
      asuOrderId,
      action,
      endpoint: `${method.toUpperCase()} ${endpoint}`,
      requestPayload: data || params,
      responsePayload: error.response?.data,
      statusCode: error.response?.status,
      success: false,
      errorMessage: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg),
      duration: Date.now() - startTime,
      source,
    }).catch((err) => console.error('[ShippingLog] Write failed:', err.message));

    throw new Error(
      `Shipping API error [${action}]: ${typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)}`
    );
  }
};

export default shippingApi;

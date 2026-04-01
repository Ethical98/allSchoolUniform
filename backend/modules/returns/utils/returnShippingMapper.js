import dotenv from 'dotenv';

dotenv.config();

/**
 * Format date to YYYY-MM-DD HH:mm format required by ShipRocket.
 * Matches the formatDate in shipping/utils/shippingMapper.js.
 */
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}`;
};

/**
 * Map a ReturnRequest to a Shiprocket return/reverse-pickup order payload.
 * Uses Shiprocket's POST /orders/create/return endpoint.
 *
 * Pickup = customer's address (where items are picked up FROM)
 * Shipping = warehouse address (where items are delivered TO)
 *
 * @param {Object} returnRequest - Mongoose ReturnRequest document
 * @param {Object} originalOrder - The original Order document
 * @param {Object} user - The customer User document
 * @returns {Object} Shiprocket-compatible return order payload
 */
export const mapReturnToShiprocketPayload = (
  returnRequest,
  originalOrder,
  user
) => {
  const nameParts = originalOrder.name ? originalOrder.name.split(' ') : [''];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const pickup = returnRequest.pickupAddress || originalOrder.shippingAddress;

  // Calculate sub_total from return items
  const subTotal = returnRequest.items.reduce((acc, item) => {
    const discountedPrice = Number(
      (item.price * (1 - (item.disc || 0) / 100)).toFixed(2)
    );
    return acc + discountedPrice * item.returnQty;
  }, 0);

  return {
    order_id: returnRequest.returnId,
    order_date: formatDate(returnRequest.createdAt),

    // Pickup FROM customer
    pickup_customer_name: firstName,
    pickup_last_name: lastName,
    pickup_address: pickup.address || '',
    pickup_city: pickup.city || '',
    pickup_state: pickup.state || '',
    pickup_pincode: pickup.postalCode || '',
    pickup_country: pickup.country || 'India',
    pickup_email: user?.email || '',
    pickup_phone: originalOrder.phone || '',

    // Ship TO warehouse
    shipping_customer_name:
      process.env.COMPANY_NAME || 'All School Uniform',
    shipping_address: process.env.WAREHOUSE_ADDRESS || '',
    shipping_city: process.env.WAREHOUSE_CITY || '',
    shipping_pincode: process.env.WAREHOUSE_PINCODE || '',
    shipping_state: process.env.WAREHOUSE_STATE || '',
    shipping_country: 'India',
    shipping_email: process.env.ADMIN_EMAIL || '',
    shipping_phone: process.env.SUPPORT_PHONE || '',

    order_items: returnRequest.items.map((item) => ({
      name: item.productName,
      sku: item.SKU
        ? `${item.SKU}${item.size ? `-${item.size}` : ''}`
        : `ASU-${item.product}${item.size ? `-${item.size}` : ''}`,
      units: item.returnQty,
      selling_price: Number(
        (item.price * (1 - (item.disc || 0) / 100)).toFixed(2)
      ),
      discount: 0,
      tax: item.tax || 0,
    })),

    payment_method: 'Prepaid', // Returns are always prepaid
    sub_total: Number(subTotal.toFixed(2)),

    length:
      Number(process.env.SHIPPING_DEFAULT_LENGTH) || 25,
    breadth:
      Number(process.env.SHIPPING_DEFAULT_BREADTH) || 20,
    height:
      Number(process.env.SHIPPING_DEFAULT_HEIGHT) || 10,
    weight:
      Number(process.env.SHIPPING_DEFAULT_WEIGHT) || 0.5,
  };
};

export default { mapReturnToShiprocketPayload };

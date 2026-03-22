import dotenv from 'dotenv';

dotenv.config();

/**
 * Format date to YYYY-MM-DD HH:mm format required by ShipRocket
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
 * Map an ASU Order document to the ShipRocket create order payload.
 * Uses modifiedItems when order.modified === true, otherwise orderItems.
 *
 * @param {Object} order - Mongoose Order document
 * @param {Object} user - User document (for email)
 * @param {string} pickupLocation - Selected pickup location name (from admin dropdown)
 * @returns {Object} ShipRocket-compatible payload
 */
export const mapOrderToProvider = (order, user, pickupLocation) => {
  // Use modifiedItems if order was modified, otherwise original orderItems
  const items = order.modified && order.modifiedItems?.length > 0
    ? order.modifiedItems
    : order.orderItems;

  const subTotal = items.reduce((acc, item) => {
    const discountedPrice = item.price * (1 - (item.disc || 0) / 100);
    return acc + discountedPrice * item.qty;
  }, 0);

  return {
    order_id: order.orderId,
    order_date: formatDate(order.createdAt),
    pickup_location: pickupLocation || process.env.SHIPPING_PICKUP_LOCATION || 'Primary',
    billing_customer_name: order.name.split(' ')[0] || order.name,
    billing_last_name: order.name.split(' ').slice(1).join(' ') || '',
    billing_address: order.shippingAddress.address,
    billing_city: order.shippingAddress.city,
    billing_pincode: order.shippingAddress.postalCode,
    billing_state: order.shippingAddress.state,
    billing_country: order.shippingAddress.country || 'India',
    billing_email: user?.email || '',
    billing_phone: order.phone,
    shipping_is_billing: true,
    order_items: items.map((item) => ({
      name: item.name,
      sku: item.productCode || `ASU-${item.product}`,
      units: item.qty,
      selling_price: Number((item.price * (1 - (item.disc || 0) / 100)).toFixed(2)),
      discount: item.disc || 0,
      tax: item.tax || 0,
    })),
    payment_method: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
    sub_total: Number(subTotal.toFixed(2)),
    ...(order.paymentMethod === 'COD' && { cod_amount: order.totalPrice }),
    length: order.shipping?.dimensions?.length || Number(process.env.SHIPPING_DEFAULT_LENGTH) || 25,
    breadth: order.shipping?.dimensions?.breadth || Number(process.env.SHIPPING_DEFAULT_BREADTH) || 20,
    height: order.shipping?.dimensions?.height || Number(process.env.SHIPPING_DEFAULT_HEIGHT) || 10,
    weight: order.shipping?.weight || Number(process.env.SHIPPING_DEFAULT_WEIGHT) || 0.5,
    shipping_charges: order.shippingPrice || 0,
  };
};

export default { mapOrderToProvider };

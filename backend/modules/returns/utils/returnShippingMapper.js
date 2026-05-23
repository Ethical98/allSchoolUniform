import dotenv from 'dotenv';

dotenv.config();

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}`;
};

export const mapReturnToShiprocketPayload = (
  returnRequest,
  originalOrder,
  user
) => {
  // Fallback to customerName (always populated on ReturnRequest)
  const fullName = originalOrder.name || returnRequest.customerName || '';
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || firstName; // SR requires non-empty last_name

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
    pickup_pincode: String(pickup.postalCode || ''),
    pickup_country: 'India',
    pickup_email: user?.email || '',
    pickup_phone: pickup.phone || originalOrder.phone || '',
    pickup_isd_code: '+91',

    // Ship TO warehouse
    shipping_customer_name:
      process.env.COMPANY_NAME || 'All School Uniform',
    shipping_last_name: 'Warehouse',
    shipping_address: process.env.WAREHOUSE_ADDRESS || '',
    shipping_city: process.env.WAREHOUSE_CITY || '',
    shipping_pincode: String(process.env.WAREHOUSE_PINCODE || ''),
    shipping_state: process.env.WAREHOUSE_STATE || '',
    shipping_country: 'India',
    shipping_email: process.env.ADMIN_EMAIL || '',
    shipping_phone: process.env.SUPPORT_PHONE || '',
    shipping_isd_code: '+91',

    order_items: returnRequest.items.map((item) => {
      const discountedPrice = Number(
        (item.price * (1 - (item.disc || 0) / 100)).toFixed(2)
      );
      // ShipRocket 'tax' expects the rupee AMOUNT, not the rate %
      const taxRate = item.tax || 0;
      const taxableBase = discountedPrice / (1 + taxRate / 100);
      const taxAmount = Number((discountedPrice - taxableBase).toFixed(2));

      return {
        name: item.productName,
        sku: item.SKU
          ? `${item.SKU}${item.size ? `-${item.size}` : ''}`
          : `ASU-${item.product}${item.size ? `-${item.size}` : ''}`,
        units: item.returnQty,
        selling_price: discountedPrice,
        discount: 0,
        tax: taxAmount,
      };
    }),

    payment_method: 'Prepaid',
    sub_total: Number(subTotal.toFixed(2)),

    length: Number(process.env.SHIPPING_DEFAULT_LENGTH) || 25,
    breadth: Number(process.env.SHIPPING_DEFAULT_BREADTH) || 20,
    height: Number(process.env.SHIPPING_DEFAULT_HEIGHT) || 10,
    weight: Number(process.env.SHIPPING_DEFAULT_WEIGHT) || 0.5,
  };
};

export default { mapReturnToShiprocketPayload };

import asyncHandler from 'express-async-handler';
import Order, { InvoiceNumber } from '../models/OrderModel.js';
import User from '../models/UserModel.js';
import Product from '../models/ProductModel.js';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import _ from 'lodash';
import { normalizeUrl } from '../utils/normalizeUrl.js';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';
dotenv.config();

// Constants for pricing rules
const FREE_SHIPPING_THRESHOLD = 599;
const SHIPPING_CHARGE = 100;

// @desc Create new order
// @route POST /api/orders
// @access Private
const addOrderItems = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;

  // Validate order items exist
  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // Extract unique product IDs from order items
  const productIds = [...new Set(orderItems.map((item) => item.product))];

  // Fetch all products from database in one query
  const products = await Product.find({ _id: { $in: productIds } }).lean();

  // Create a map for quick product lookup
  const productMap = new Map();
  products.forEach((product) => {
    productMap.set(product._id.toString(), product);
  });

  // Validate and recalculate prices for each order item
  const validatedOrderItems = [];
  let calculatedItemsPrice = 0;

  for (const item of orderItems) {
    const product = productMap.get(item.product);

    if (!product) {
      res.status(400);
      throw new Error(`Product not found: ${item.product}`);
    }

    // Check if product is active
    if (!product.isActive) {
      res.status(400);
      throw new Error(`Product is not available: ${product.name}`);
    }

    // Find the size variant - try by sizeVariant ID first, then by size string
    let sizeVariant = null;

    // Method 1: Match by sizeVariant ID (most precise)
    if (item.sizeVariant) {
      sizeVariant = product.size.find(
        (s) => s._id.toString() === item.sizeVariant
      );
    }

    // Method 2: Fallback to size string match
    if (!sizeVariant && item.size) {
      sizeVariant = product.size.find(
        (s) => s.size.toLowerCase() === item.size.toLowerCase()
      );
    }

    if (!sizeVariant) {
      res.status(400);
      throw new Error(
        `Size "${item.size}" not found for product: ${product.name}`
      );
    }

    // Check if size is out of stock
    if (sizeVariant.outOfStock || sizeVariant.countInStock < item.qty) {
      res.status(400);
      throw new Error(
        `Insufficient stock for ${product.name} (Size: ${item.size})`
      );
    }

    // Get the actual price from database (MRP)
    const actualPrice = sizeVariant.price;
    const discountPercentage = sizeVariant.discount || 0;

    // Calculate the discounted price (actual price customer pays)
    const discountedPrice = discountPercentage > 0
      ? actualPrice * (1 - discountPercentage / 100)
      : actualPrice;

    // Calculate item total using discounted price
    const itemTotal = discountedPrice * item.qty;
    calculatedItemsPrice += itemTotal;

    // Build validated order item with server-verified data
    validatedOrderItems.push({
      name: product.name,
      qty: item.qty,
      image: normalizeUrl(product.image),
      price: actualPrice, // Price from DB, not client
      size: sizeVariant.size, // Use DB size string for consistency
      sizeVariant: sizeVariant._id.toString(),
      product: item.product,
      schoolName: item.schoolName || product.schoolName?.[0] || '',
      disc: sizeVariant.discount || 0, // Discount percentage for reference
      tax: sizeVariant.tax || 0, // Tax information
    });
  }

  // Calculate shipping (free above threshold)
  const calculatedShippingPrice =
    calculatedItemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;

  // Calculate tax (currently 0, can be configured)
  const calculatedTaxPrice = 0;

  // Calculate total
  const calculatedTotalPrice =
    calculatedItemsPrice + calculatedShippingPrice + calculatedTaxPrice;

  // Create the order with server-calculated prices
  const order = new Order({
    orderItems: validatedOrderItems,
    user: req.user._id,
    name: req.user.name,
    phone: req.user.phone,
    shippingAddress,
    paymentMethod,
    itemsPrice: calculatedItemsPrice,
    taxPrice: calculatedTaxPrice,
    shippingPrice: calculatedShippingPrice,
    totalPrice: calculatedTotalPrice,
    orderStatus: `Received: ${Date.now()}`,
  });

  const createdOrder = await order.save();

  // // Send order confirmation email asynchronously (don't block response)
  // sendOrderConfirmationEmail(createdOrder, req.user).catch(error => {
  //   console.error('Email sending failed (non-blocking):', error.message);
  // });

  res.status(201).json(createdOrder);
});


// @desc Get order by ID
// @route GET /api/orders/:id
// @access Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email phone'
  );

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order Not Found');
  }
});

// @desc Update order to Paid
// @route GET /api/orders/:id/pay
// @access Private
const updateOrderToPaidPayUMoney = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      // update_time: req.body.update_time,
      // email_address: req.body.payer.email_address,
    };

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order Not Found');
  }
});

// @desc Update order to Paid
// @route GET /api/orders/:id/pay
// @access Private
const updateOrderTopaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  const { paymentResult } = req.body;

  if (order) {
    const user = await User.findById(order.user);
    order.name = user.name;
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: paymentResult.razorpay_payment_id,
      orderId: paymentResult.razorpay_order_id,
      signature: paymentResult.razorpay_signature,
      name: paymentResult.name,
      email: paymentResult.email,
    };

    const updatedOrder = await order.save();

    // // Send order confirmation email after successful payment
    // sendOrderConfirmationEmail(updatedOrder, user).catch(error => {
    //   console.error('Email sending failed after payment (non-blocking):', error.message);
    // });

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order Not Found');
  }
});

// @desc Get logged in user orders
// @route GET /api/orders/myorders
// @access Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  if (orders.length > 0) {
    res.json(orders);
  } else {
    res.status(404);
    throw new Error('No orders Found');
  }
});

const sendMail = asyncHandler(async (req, res) => {
  const oAuth2Client = new google.auth.OAuth2(
    OAUTH2_CLIENT_ID,
    OAUTH2_CLIENT_SECRET,
    OAUTH2_REDIRECT_URI
  );
  oAuth2Client.setCredentials({ refresh_token: OAUTH2_REFRESH_TOKEN });

  try {
    const accessToken = await oAuth2Client.getAccessToken();
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'Oauth2',
        user: 'noreply@gouniform.com',
        clientId: OAUTH2_CLIENT_ID,
        clientSecret: OAUTH2_CLIENT_SECRET,
        refreshToken: OAUTH2_REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: 'ALLSCHOOLUNIFORM noreply@allschooluniform.com',
      replyTo: 'akash@gounifrom.com',
      to: 'devanshgupta54@gmail.com',
      subject: 'ORDER',
      text: 'HELOOOOOOO',
      html: '<table style="border:2px solid green"><thead><tr><th>HELLO</th><th>NAME</th><th>PRICE</th><th>CHANGES</th></tr></thead></table>',
    };

    const mailOptions2 = {
      from: 'ALLSCHOOLUNIFORM noreply@allschooluniform.com',
      replyTo: 'akash@gounifrom.com',
      to: 'devanshgupta54@gmail.com',
      subject: 'ORDER',
      text: 'HELOOOOOOO',
      html: '<table><thead><tr><th>HELLO</th><th>NAME</th><th>PRICE</th><th>CHANGES</th></tr></thead></table>',
    };
    const result = await transport.sendMail(mailOptions);
    const result2 = await transport.sendMail(mailOptions2);

    // const res = await gmail.users.messages.send({
    //   userId: 'devansh.gupta73@yahoo.in',
    //   requestBody: {
    //     raw: 'hello',
    //     access_token: accessToken,
    //     refresh_token: REFRESH_TOKEN,

    //     clientId: CLIENT_ID,
    //     clientSecret: CLIENT_SECRET,
    //   },
    // });
    // console.log(res.data);
  } catch (error) {
    console.log(error);
  }
});

// @desc Get all orders
// @route GET /api/orders
// @access Private?Admin
const getOrders = asyncHandler(async (req, res) => {
  const pageSize = 25;

  const { keyword, status } = req.query;

  const orderStatusSearch = status
    ? {
      orderStatus: {
        $regex: status,
        $options: 'i',
      },
    }
    : {};

  const searchKeyword = keyword
    ? {
      name: {
        $regex: keyword,
        $options: 'i',
      },
    }
    : {};
  const searchKeywordTwo = keyword
    ? {
      orderId: {
        $regex: keyword,
        $options: 'i',
      },
    }
    : {};
  const searchKeywordThree = keyword
    ? {
      phone: {
        $regex: keyword,
        $options: 'i',
      },
    }
    : {};

  const page = Number(req.query.pageNumber) || 1;

  const orders = await Order.find({
    $and: [
      {
        $or: [
          { ...searchKeyword },
          { ...searchKeywordTwo },
          { ...searchKeywordThree },
        ],
      },
      { ...orderStatusSearch },
    ],
  })
    .populate('user', 'id name')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  const count = await Order.countDocuments({
    $and: [
      {
        $or: [
          { ...searchKeyword },
          { ...searchKeywordTwo },
          { ...searchKeywordThree },
        ],
      },
      { ...orderStatusSearch },
    ],
  });

  if (orders.length > 0) {
    res.json({ orders, page, pages: Math.ceil(count / pageSize) });
  } else {
    res.status(404);
    throw new Error('No orders Found');
  }
});

// @desc Edit order
// @route PUT /api/orders/:id
// @access Private/Admin
const editOrderById = asyncHandler(async (req, res) => {
  const { modifiedOrderItems, shippingAddress, itemsPrice, totalPrice } =
    req.body;

  const order = await Order.findById(req.params.id);
  if (order) {
    const user = await User.findById(order.user);
    order.name = user.name;
    order.shippingAddress = shippingAddress || order.shippingAddress;

    order.totalPrice = totalPrice || order.totalPrice;

    if (modifiedOrderItems && modifiedOrderItems.length === 0) {
      order.modified = false;
    } else {
      order.modified = true;
      order.modifiedItems = [...modifiedOrderItems];
    }
    const updatedOrder = await order.save();
    res.status(200);
    res.json(updatedOrder);
  }
});

// @desc Get order by ORDERID
// @route GET /api/orders/orderid/:id
// @access Public
const getOrderByOrderId = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.id });
  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order Not Found');
  }
});

// @desc Update order to Delivered
// @route GET /api/orders/:id/deliver
// @access Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    const user = await User.findById(order.user);
    order.name = user.name;
    if (
      order.tracking.isConfirmed &&
      order.tracking.isProcessing &&
      order.tracking.isOutForDelivery
    ) {
      order.tracking.isDelivered = true;
      order.tracking.deliveredAt = Date.now();
      order.orderStatus = `Delivered: ${Date.now()}`;

      const updatedOrder = await order.save();

      res.json(updatedOrder);
    } else {
      res.status(500);
      throw new Error('Cannot Update Delivered Before It is out for Delivery');
    }
  } else {
    res.status(404);
    throw new Error('Order Not Found');
  }
});

// @desc Update order to Out For Delivery
// @route GET /api/orders/:id/outfordelivery
// @access Private/Admin
const updateOrderToOutForDelivery = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    const user = await User.findById(order.user);
    order.name = user.name;
    if (order.tracking.isConfirmed && order.tracking.isProcessing) {
      order.tracking.isOutForDelivery = true;
      order.tracking.outForDeliveryAt = Date.now();
      order.orderStatus = `Out For Delivery: ${Date.now()}`;

      const updatedOrder = await order.save();

      res.json(updatedOrder);
    } else {
      res.status(500);
      throw new Error(
        'Cannot Update To Out For Delivery Before It is under Processing '
      );
    }
  } else {
    res.status(404);
    throw new Error('Order Not Found');
  }
});

// @desc Update order to Processing
// @route GET /api/orders/:id/processing
// @access Private/Admin
const updateOrderToProcessing = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    const user = await User.findById(order.user);
    order.name = user.name;
    if (order.tracking.isConfirmed) {
      order.tracking.isProcessing = true;
      order.tracking.processedAt = Date.now();
      order.orderStatus = `Processed: ${Date.now()}`;

      const updatedOrder = await order.save();

      res.json(updatedOrder);
    } else {
      res.status(500);
      throw new Error('Cannot Update To Processing Before It is Confirmed ');
    }
  } else {
    res.status(404);
    throw new Error('Order Not Found');
  }
});

// @desc Update order to Confirmed
// @route GET /api/orders/:id/confirm
// @access Private/Admin
const updateOrderToConfirmed = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    const user = await User.findById(order.user);
    order.name = user.name;
    order.tracking.isConfirmed = true;
    order.tracking.confirmedAt = Date.now();
    order.orderStatus = `Confirmed: ${Date.now()}`;

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order Not Found');
  }
});

// @desc Update order to Confirmed
// @route GET /api/orders/:id/cancel
// @access Private/Admin
const updateOrderToCanceled = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    const user = await User.findById(order.user);
    order.name = user.name;
    order.tracking.isCanceled = true;
    order.tracking.canceledAt = Date.now();
    order.orderStatus = `Canceled: ${Date.now()}`;

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order Not Found');
  }
});

// @desc Update order BillType
// @route POST /api/orders/:id/billType
// @access Private/Admin
const updateOrderBillType = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  const billType = req.body.billType;

  if (order) {
    const user = await User.findById(order.user);
    order.name = user.name;
    order.billType = billType;
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order Not Found');
  }
});

// @desc Update order BillType
// @route GET /api/orders/:id/incrementInvoiceNumber
// @access Private/Admin
const incrementInvoiceNumber = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const order = await Order.findById(orderId);
  if (order) {
    const user = await User.findById(order.user);
    order.name = user.name;
    const invoice = await InvoiceNumber.findByIdAndUpdate(
      { _id: 'invoiceNumber' },
      { $inc: { number: 1 } },
      { new: true, upsert: true }
    );
    order.invoiceNumber = invoice.number;
    const updatedOrder = await order.save();
    return res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc generate order reports
// @route GET /api/orders/report
// @access Private/Admin
const orderReport = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    createdAt: {
      $gte: new Date('2022-10-06').toISOString(),
      $lt: new Date().toISOString(),
    },
    modified: true,
  })
    .populate('user', 'name email phone')
    .lean();

  orders.forEach(
    (orderObj) =>
    (orderObj.pendingItems = orderObj.orderItems.filter(
      (originalItem) =>
        !orderObj.modifiedItems.some(
          (item) => item.name === originalItem.name
        )
    ))
  );

  const pendingOrders = orders.filter((order) => order.pendingItems.length > 0);

  res.status(200).json(pendingOrders);
});

export {
  getOrders,
  addOrderItems,
  getOrderById,
  updateOrderTopaid,
  getMyOrders,
  sendMail,
  editOrderById,
  getOrderByOrderId,
  updateOrderToConfirmed,
  updateOrderToOutForDelivery,
  updateOrderToDelivered,
  updateOrderToProcessing,
  updateOrderToCanceled,
  updateOrderBillType,
  incrementInvoiceNumber,
  orderReport,
};

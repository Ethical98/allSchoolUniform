import asyncHandler from 'express-async-handler';
import Order, { InvoiceNumber } from '../models/OrderModel.js';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import _ from 'lodash';
dotenv.config();

// @desc Create new order
// @route GET /api/orders
// @access Private
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  } else {
    const order = new Order({
      orderItems,
      user: req.user._id,
      phone: req.user.phone,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    // console.log(orderItems);
    // const imageArray = [];
    // for (var i = 0; i < orderItems.length; i++) {
    //   imageArray.push({
    //     filename: orderItems[i].name,
    //     path: 'frontend/public' + orderItems[i].image,
    //     cid: orderItems[i].name,
    //   });
    //   // result[i].filename = orderItems[i].name;
    //   // result[i].path = orderItems[i].image;
    //   // result[i].cid = orderItems[i].image;
    // }
    // console.log(imageArray);
    const createdOrder = await order.save();
    res.status(201).json(createdOrder);

    // const oAuth2Client = new google.auth.OAuth2(
    //   OAUTH2_CLIENT_ID,
    //    OAUTH2_CLIENT_SECRET,
    //    OAUTH2_REDIRECT_URI
    // );
    // oAuth2Client.setCredentials({  refresh_token:  OAUTH2_REFRESH_TOKEN });

    // try {
    //   const accessToken = await oAuth2Client.getAccessToken();
    //   const transport = nodemailer.createTransport({
    //     service: 'gmail',
    //     auth: {
    //       type: 'Oauth2',
    //       user: 'noreply@gouniform.com',
    //       clientId:  OAUTH2_CLIENT_ID,
    //       clientSecret:  OAUTH2_CLIENT_SECRET,
    //       refreshToken:  OAUTH2_REFRESH_TOKEN,
    //       accessToken: accessToken,
    //     },
    //   });

    //   const mailOptions = {
    //     from: 'ALLSCHOOLUNIFORM',
    //     replyTo: 'akash@gounifrom.com',
    //     to: 'devanshgupta54@gmail.com',
    //     subject: 'ORDER',
    //     text: 'HELOOOOOOO',
    //     html:
    //       '<h1>' +
    //       createdOrder.orderId +
    //       '</h1><table style="border:2px solid green;border-collapse:collapse"><tr><th style="border:2px solid green;border-collapse:collapse">S.NO</th><th>IMAGE</th><th>NAME</th><th>SIZE</th><th>PRICE</th></tr>' +
    //       orderItems
    //         .map(
    //           (x, index) =>
    //             '<tr style="border:2px solid green;border-collapse:collapse"><td style="border:2px solid green">' +
    //             (index + 1) +
    //             '</td><td style="border:2px solid green;border-collapse:collapse;width:20vw">' +
    //             `<img style="width:10vw" src="cid:${x.name}"/>` +
    //             '</td><td style="border:2px solid green;border-collapse:collapse">' +
    //             x.name +
    //             '</td><td style="border:2px solid green;border-collapse:collapse">' +
    //             x.size +
    //             '</td><td style="border:2px solid green;border-collapse:collapse" >' +
    //             x.qty +
    //             '*' +
    //             x.price +
    //             '=' +
    //             x.qty * x.price +
    //             '</td></tr>'
    //         )
    //         .join('') +
    //       '</table>',
    //     attachments: imageArray,
    //   };

    //   // const mailOptions2 = {
    //   //   from: 'ALLSCHOOLUNIFORM noreply@allschooluniform.com',
    //   //   replyTo: 'akash@gounifrom.com',
    //   //   to: 'devanshgupta54@gmail.com',
    //   //   subject: 'ORDER',
    //   //   text: 'HELOOOOOOO',
    //   //   html: '<table><thead><tr><th>HELLO</th><th>NAME</th><th>PRICE</th><th>CHANGES</th></tr></thead></table>',
    //   // };
    //   const result = await transport.sendMail(mailOptions);
    //   // const result2 = await transport.sendMail(mailOptions2);
    //   console.log(result);
    //   // console.log(result2);
    // } catch (error) {
    //   console.log(error);
    // }
  }
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
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: paymentResult.mihpayid,
      status: paymentResult.status,
      update_time: paymentResult.update_time,
      name: paymentResult.name,
    };

    const updatedOrder = await order.save();

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
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const count = await Order.countDocuments({});
  const orders = await Order.find({})
    .populate('user', 'id name')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

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
    if (
      order.tracking.isConfirmed &&
      order.tracking.isProcessing &&
      order.tracking.isOutForDelivery
    ) {
      order.tracking.isDelivered = true;
      order.tracking.deliveredAt = Date.now();

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
    if (order.tracking.isConfirmed && order.tracking.isProcessing) {
      order.tracking.isOutForDelivery = true;
      order.tracking.outForDeliveryAt = Date.now();

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
    if (order.tracking.isConfirmed) {
      order.tracking.isProcessing = true;
      order.tracking.processedAt = Date.now();

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
    order.tracking.isConfirmed = true;
    order.tracking.confirmedAt = Date.now();

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
    const invoice = await InvoiceNumber.findByIdAndUpdate(
      { _id: 'invoiceNumber' },
      { $inc: { number: 1 } },
      { new: true, upsert: true }
    );
    console.log(invoice.number);
    order.invoiceNumber = invoice.number;
    const updatedOrder = await order.save();
    return res.json(updatedOrder);

  } else {
    res.status(404);
    throw new Error('Order not found');
  }
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
  updateOrderBillType,
  incrementInvoiceNumber,
};

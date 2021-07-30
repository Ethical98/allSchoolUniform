import asyncHandler from 'express-async-handler';
import Order from '../models/OrderModel.js';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';
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
  const orders = await Order.find({ user: req.user._id });

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
    console.log(result);
    console.log(result2);

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
  const orders = await Order.find({}).populate('user', 'id name');

  if (orders.length > 0) {
    res.json(orders);
  } else {
    res.status(404);
    throw new Error('No orders Found');
  }
});

// @desc Edit order
// @route POST /api/orders/:id
// @access Private/Admin
const editOrderById = asyncHandler(async (req, res) => {
  const { modifiedOrderItems, shippingAddress, itemsPrice, totalPrice } =
    req.body;

  const order = await Order.findById(req.params.id);
  if (order) {
    order.shippingAddress = shippingAddress || order.shippingAddress;
    // order.itemsPrice = itemsPrice || order.itemsPrice;
    // order.taxPrice = taxPrice || order.taxPrice;
    // //order.shippingPrice = shippingPrice || order.shippingPrice;
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

export {
  getOrders,
  addOrderItems,
  getOrderById,
  updateOrderTopaid,
  getMyOrders,
  sendMail,
  editOrderById,
};

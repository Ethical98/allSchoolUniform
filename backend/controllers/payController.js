import asyncHandler from 'express-async-handler';
import jsSHA from 'jssha';
import dotenv from 'dotenv';
import Crypto from 'crypto';
import Razorpay from 'razorpay';

dotenv.config();

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_SALT,
});

// @desc Payment Request
// @route POST /api/pay/payment/
// @access Private
const orderPayment = asyncHandler(async (req, res) => {
  const options = {
    amount: Number(req.body.amount * 100),
    currency: 'INR',
  };
  const order = await instance.orders.create(options);

  res.status(200).json({ order, success: true });
});

// @desc Payment Request
// @route POST /api/pay/payment/verify
// @access Private
const orderPaymentVerify = (req, res) => {
  const body =
    req.body.response.razorpay_order_id +
    '|' +
    req.body.response.razorpay_payment_id;

  const expectedSignature = Crypto.createHmac(
    'sha256',
    process.env.RAZORPAY_SALT
  )
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === req.body.response.razorpay_signature) {
    res.status(200).json({ paymentSuccess: true });
  } else {
    res.status(400);
    throw new Error('Payment Failed');
  }
};

// @desc Payment Request
// @route POST /api/pay/payment/payumoney/response
// @access Private

// const payUMoneyPaymentResponse = function (req, res) {
//   const { response } = req.body;

//   if (response.txnStatus == 'CANCEL') {
//     res.status(402);
//     throw new Error(response.txnMessage);
//   } else {
//     const hashString =
//       process.env.PAYUMONEY_SALT +
//       '|' +
//       response.status +
//       '||||||' +
//       response.udf5 +
//       '|||||' +
//       response.email +
//       '|' +
//       response.firstname +
//       '|' +
//       response.productinfo +
//       '|' +
//       response.amount +
//       '|' +
//       response.txnid +
//       '|' +
//       response.key;

//     const sha = new jsSHA('SHA-512', 'TEXT');
//     sha.update(hashString);
//     const hash = sha.getHash('HEX');

//     if (hash == response.hash) {
//       res.send({
//         status: response.txnStatus,
//         message: response.txnMessage,
//         update_time: response.addedon,
//         name: response.name_on_card,
//         mihpayid: response.mihpayid,
//       });
//     } else {
//       throw new Error(response.txnMessage);
//     }
//   }
// };

// @desc Payment Request
// @route POST /api/pay/payment/payumoney
// @access Private
// const payUMoneyPayment = asyncHandler((req, res) => {
//   dotenv.config();
//   const { txnid, amount, productinfo, firstname, email, udf5 } = req.body;

//   if (!txnid || !amount || !productinfo || !firstname || !email) {
//     res.status(400);
//     throw new Error('Mandatory Fields Missing');
//   } else {
//     const hashString =
//       process.env.PAYUMONEY_MERCHANT_KEY +
//       '|' +
//       txnid +
//       '|' +
//       amount +
//       '|' +
//       productinfo +
//       '|' +
//       firstname +
//       '|' +
//       email +
//       '|||||' +
//       udf5 +
//       '||||||' +
//       process.env.PAYUMONEY_SALT;

//     const sha = new jsSHA('SHA-512', 'TEXT');

//     sha.update(hashString);

//     const hash = sha.getHash('HEX');

//     res.json({ hash: hash });
//   }
// });

export { orderPayment, orderPaymentVerify };

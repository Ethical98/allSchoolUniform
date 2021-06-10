import asyncHandler from 'express-async-handler';
import jsSHA from 'jssha';
import dotenv from 'dotenv';

// @desc Payment Request
// @route POST /api/pay/payment/payumoney
// @access Private
const payUMoneyPayment = asyncHandler((req, res) => {
  dotenv.config();
  const { txnid, amount, productinfo, firstname, email, udf5 } = req.body;
  console.log(txnid, amount, productinfo, firstname, email, udf5);

  if (!txnid || !amount || !productinfo || !firstname || !email) {
    res.status(400);
    throw new Error('Mandatory Fields Missing');
  } else {
    console.log(process.env.PAYUMONEY_MERCHANT_KEY);
    const hashString =
      process.env.PAYUMONEY_MERCHANT_KEY +
      '|' +
      txnid +
      '|' +
      amount +
      '|' +
      productinfo +
      '|' +
      firstname +
      '|' +
      email +
      '|||||' +
      udf5 +
      '||||||' +
      process.env.PAYUMONEY_SALT;

    const sha = new jsSHA('SHA-512', 'TEXT');

    sha.update(hashString);

    const hash = sha.getHash('HEX');

    res.json({ hash: hash });
  }
});

// @desc Payment Request
// @route POST /api/pay/payment/payumoney/response
// @access Private

const payUMoneyPaymentResponse = function (req, res) {
  const { response } = req.body;
  if (response.txnStatus == 'CANCEL') {
    throw new Error(response.txnMessage);
  } else {
    const hashString =
      process.env.PAYUMONEY_SALT +
      '|' +
      response.status +
      '||||||' +
      response.udf5 +
      '|||||' +
      response.email +
      '|' +
      response.firstname +
      '|' +
      response.productinfo +
      '|' +
      response.amount +
      '|' +
      response.txnid +
      '|' +
      response.key;

    const sha = new jsSHA('SHA-512', 'TEXT');
    sha.update(hashString);
    const hash = sha.getHash('HEX');
    console.log(hash);
    if (hash == response.hash) {
      res.send({
        status: response.txnStatus,
        message: response.txnMessage,
        update_time: response.addedon,
        name: response.name_on_card,
        mihpayid: response.mihpayid,
      });
    } else {
      throw new Error(response.txnMessage);
    }
  }

  // PG_TYPE: "HdfcCYBER"
  // addedon: "2021-06-06 14:20:39"
  // address1: ""
  // address2: ""
  // amount: "1.00"
  // amount_split: "{\"PAYU\":\"1.00\"}"
  // bank_ref_num: "6229694635106306306102"
  // bankcode: "VISA"
  // cardToken: "1d6dcc958543a3d7baddb"
  // cardhash: "This field is no longer supported in postback params."
  // cardnum: "414366XXXXXX6098"
  // city: ""
  // country: ""
  // discount: "0.00"
  // email: "admin@example.com"
  // encryptedPaymentId: "BFAFD7D7C8F8D779C18256797393394C"
  // error: "E000"
  // error_Message: "No Error"
  // field1: "6229694635106306306102"
  // field2: "024268"
  // field3: "1.00"
  // field4: "13193770149"
  // field5: "100"
  // field6: "05"
  // field7: "AUTHPOSITIVE"
  // field8: ""
  // field9: "Transaction is Successful"
  // firstname: "Admin User"
  // furl: "http://localhost:3000/products"
  // giftCardIssued: "true"
  // hash: "d38cf494c41717af753b731f067df52bdfbd5c6be59e349fd94b94ce57d8ea73a39edb9e8930e0c1802a80b9a7a8fe08d1a76ecbf1e9eeaed301919e5f1173b1"
  // isConsentPayment: "0"
  // key: "AmGcoP1p"
  // lastname: ""
  // mihpayid: "13193770149"
  // mode: "DC"
  // name_on_card: "DEVANSHGUPTA"
  // net_amount_debit: "1"
  // payuMoneyId: "436053039"
  // phone: "9716438285"
  // productinfo: "P01,P02"
  // state: ""
  // status: "success"
  // surl: "http://localhost:3000/profile"
  // txnMessage: "Transaction Successful"
  // txnStatus: "SUCCESS"
  // txnid: "60bc8c1ef1ae9110103a6678"
  // udf1: ""
  // udf2: ""
  // udf3: ""
  // udf4: ""
  // udf5: "ALLSCHOOLUNIFORM"
  // udf6: ""
  // udf7: ""
  // udf8: ""
  // udf9: ""
  // udf10: ""
  // unmappedstatus: "captured"
  // zipcode: ""

  // console.log(response.txnStatus);

  // console.log(
  //   response.txnid,
  //   response.amount,
  //   reponse.productinfo,
  //   reponse.firstname,
  //   response.email,
  //   response.udf5,
  //   reponse.hash
  // );

  //Generate new Hash
};

export { payUMoneyPayment, payUMoneyPaymentResponse };

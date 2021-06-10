import asyncHandler from 'express-async-handler';
import User from '../models/UserModel.js';
import generateToken from '../utils/generateToken.js';
import dotenv from 'dotenv';
dotenv.config();

// @desc Auth user & get token
// @route POST /api/users/login
// @access Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      token: generateToken(user._id, user.name),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or Password');
  }
});

// @desc Auth user & get token
// @route POST /api/users/loginByOtp
// @access Public
const authUserByOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  const user = await User.findOne({ phone });
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      token: generateToken(user._id, user.name),
    });
  } else {
    res.status(401);
    throw new Error('Not Registered');
  }
});

// @desc Register a new user
// @route POST /api/users
// @access Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const userExists = await User.findOne({ phone });
  const userEmailExists = await User.findOne({ email });

  if (userEmailExists) {
    res.status(400);
    throw new Error('Email id already REGISTERED');
  }
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
  });
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      token: generateToken(user._id, user.name),
    });
  } else {
    res.status(400);
    throw new Error('Invalid User Data');
  }
});

// @desc Get user profile
// @route GET /api/users/profile
// @access Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('User Not Found');
  }
});

// @desc Update user profile
// @route PUT /api/users/profile
// @access Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      isAdmin: updatedUser.isAdmin,
      token: generateToken(updatedUser._id, updatedUser.name),
    });
  } else {
    res.status(404);
    throw new Error('User Not Found');
  }
});

// @desc Auth user & get token
// @route POST /api/users/loginByPhone
// @access public
const authUserByPhone = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  const user = await User.findOne({ phone });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      token: generateToken(user._id, user.name),
    });
  } else {
    res.status(401);
    throw new Error('Invalid Email/Mobile or Password');
  }
});

// @desc Get User Phone
// @route POST /api/users/getPhone
// @access public
const getUserPhone = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    res.json({
      phone: user.phone,
    });
  } else {
    res.status(401);
    throw new Error('Not Registered');
  }
});

// @desc Get OTP
// @route POST /api/users/getOtp
// @access public
// const getOtp = asyncHandler(async (req, res) => {
// try {
//   const data = await client.verify
//     .services(process.env.TWILIO_SERVICE_ID)
//     .verifications.create({
//       to: `+91${req.body.phone}`,
//       channel: 'sms',
//     });
//   res.json(data);
// } catch (error) {
//   res.status(500);
//   throw new Error('Too many Attempts! Please Try Again After some time');
// }
//   vonage.verify.request(
//     {
//       number: `91${req.body.phone}`,
//       brand: 'Vonage',
//     },
//     (err, result) => {
//       if (err) {
//         res.status(400);
//         throw new Error('hellooo');
//       } else {
//         res.status(400);
//         // const verifyRequestId = result.request_id;
//         throw new Error('Hello World');
//         // res.json(verifyRequestId);
//       }
//     }
//   );
// });

// @desc get OTP
// @route POST /api/users/verifyOtp
// @access private
// const verifyOtp = asyncHandler(async (req, res) => {
//   // try {
//   //   const data = await client.verify
//   //     .services(process.env.TWILIO_SERVICE_ID)
//   //     .verificationChecks.create({
//   //       to: `+91${req.body.phone}`,
//   //       code: req.body.code,
//   //     });

//   //   res.json(data);
//   // } catch (error) {
//   //   res.status(500);
//   //   throw new Error('Please Enter Correct OTP ');
//   // }
//   vonage.verify.check(
//     {
//       request_id: req.body.id,
//       code: req.body.code,
//     },
//     (err, result) => {
//       if (err) {
//         res.json(400);
//         throw new Error('Please Enter Correct OTP ');
//         // res.json({
//         //   message: result.error_text,
//         // });
//         // res.json('pleaaeee');
//         // console.error(err);
//       } else if (result.status != 0) {
//         res.json('Please!! Resend OTP');
//       } else {
//         res.status(200);
//         res.json(result.request_id);
//         // console.log(result);
//       }
//     }
//   );

// try {
//   const data = vonage.verify.check({
//     request_id: req.body.id,
//     code: req.body.code,
//   });

//   res.json(data);
// } catch (error) {
//   res.json(error);
// }
// });

const saveUserShippingAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { data } = req.body;
  if (user) {
    user.savedAddress = [...user.savedAddress, data];
    await user.save();
    res.json('Address Saved');
  } else {
    res.status(404);
    throw new Error('User Not Found');
  }
});

const getShipppingAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json(user.savedAddress);
  } else {
    res.status(404);
    throw new Error('User Not Found');
  }
});

export {
  getShipppingAddress,
  registerUser,
  authUser,
  getUserProfile,
  saveUserShippingAddress,
  // getOtp,
  // verifyOtp,
  authUserByPhone,
  updateUserProfile,
  getUserPhone,
  authUserByOTP,
};

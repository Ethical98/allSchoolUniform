import asyncHandler from 'express-async-handler';
import User from '../models/UserModel.js';
import generateToken from '../utils/generateToken.js';

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
      token: generateToken(user._id, user.name, user.isAdmin),
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
      token: generateToken(user._id, user.name, user.isAdmin),
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
      token: generateToken(user._id, user.name, user.isAdmin),
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
      savedAddress: user.savedAddress,
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
      token: generateToken(user._id, user.name, user.isAdmin),
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
      token: generateToken(user._id, user.name, user.isAdmin),
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
  const email = req.body.email;

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

// @desc Save User saved Addresses
// @route POST /api/users/shippingAddress
// @access public
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

// @desc Get User saved Addresses
// @route GET /api/users/shippingAddress
// @access public
const getShipppingAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json(user.savedAddress);
  } else {
    res.status(404);
    throw new Error('User Not Found');
  }
});

// @desc Check if email address is registered
// @route POST /api/users/forgotPassword
// @access public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    res.json('User Found');
  } else {
    res.status(400);
    throw new Error('User not Registered!!');
  }
});

// @desc Reset Password
// @route POST /api/users/resetPassword
// @access public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    if (password) {
      user.password = password;
    }
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      isAdmin: updatedUser.isAdmin,
      token: generateToken(
        updatedUser._id,
        updatedUser.name,
        updatedUser.isAdmin
      ),
    });
  } else {
    res.status(400);
    throw new Error('User not Registered!!');
  }
});

// @desc Get all users
// @route GET /api/users
// @access Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const count = await User.countDocuments({});
  const users = await User.find()
    .limit(pageSize)
    .skip(pageSize * (page - 1));
  res.json({ users, page, pages: Math.ceil(count / pageSize) });
});

// @desc Delete User
// @route DELETE /api/users/:id
// @access Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    await user.remove();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc Get user by ID
// @route GET /api/users/:id
// @access Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc Update user
// @route PUT /api/users/:id
// @access Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.isAdmin = req.body.isAdmin;
    user.savedAddress = [...req.body.savedAddress] || [...user.savedAddress];

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      isAdmin: updatedUser.isAdmin,
      savedAddress: [...updatedUser.savedAddress],
    });
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
  authUserByPhone,
  updateUserProfile,
  getUserPhone,
  authUserByOTP,
  forgotPassword,
  resetPassword,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
};

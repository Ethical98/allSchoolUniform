import asyncHandler from 'express-async-handler';
import User from '../models/UserModel.js';
import generateToken from '../utils/generateToken.js';
import mongoose from 'mongoose';
// ==================== NEW ENDPOINTS ====================
/**
 * @desc Get current user (validate session from HTTP-only cookie)
 * @route GET /api/users/me
 * @access Private
 */
const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isAdmin: user.isAdmin,
                savedAddress: user.savedAddress || [],
                authMethod: user.authMethod || 'password',
                isProfileComplete: user.isProfileComplete ?? true,
            },
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});
/**
 * @desc Logout user (clear HTTP-only cookie)
 * @route POST /api/users/logout
 * @access Public
 */
const logout = asyncHandler(async (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0), // Expire immediately
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    });
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});
/**
 * @desc Change user password (with current password validation)
 * @route POST /api/users/change-password
 * @access Private
 */
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    // Validate request body
    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Current password and new password are required');
    }
    // Validate new password strength
    if (newPassword.length < 8) {
        res.status(400);
        throw new Error('New password must be at least 8 characters long');
    }
    // Find user with password field
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    // Verify current password
    const isPasswordMatch = await user.matchPassword(currentPassword);
    if (!isPasswordMatch) {
        res.status(401);
        throw new Error('Current password is incorrect');
    }
    // Check if new password is same as current
    const isSamePassword = await user.matchPassword(newPassword);
    if (isSamePassword) {
        res.status(400);
        throw new Error('New password must be different from current password');
    }
    // Update password (will be hashed by pre-save hook in User model)
    user.password = newPassword;
    await user.save();
    // Generate new token for security
    const token = generateToken(user._id, user.name, user.isAdmin);
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    console.log(`[Auth] Password changed for user: ${user._id}`);
    res.json({
        success: true,
        message: 'Password changed successfully',
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        authMethod: user.authMethod || 'password',
        token,
    });
});
// ==================== EXISTING ENDPOINTS (UPDATED) ====================
// @desc Auth user & get token
// @route POST /api/users/login
// @access Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        const token = generateToken(user._id, user.name, user.isAdmin);
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
        // ✅ Token removed from response body
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isAdmin: user.isAdmin,
            authMethod: user.authMethod || 'password',
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
    let user = await User.findOne({ phone });
    let isNewUser = false;

    // If user doesn't exist, auto-create with phone only
    if (!user) {
        user = await User.create({
            phone,
            name: `User_${phone.slice(-4)}`, // Temporary name using last 4 digits
            authMethod: 'otp',
            isProfileComplete: false,
        });
        isNewUser = true;
        console.log(`[Auth] New user auto-created via OTP: ${phone}`);
    }

    const token = generateToken(user._id, user.name, user.isAdmin);
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(isNewUser ? 201 : 200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        isNewUser,
        isProfileComplete: user.isProfileComplete,
        authMethod: user.authMethod || 'password',
        token,
    });
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
        const token = generateToken(user._id, user.name, user.isAdmin);
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
        // ✅ Token removed from response body
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
            authMethod: user.authMethod || 'password',
            isProfileComplete: user.isProfileComplete ?? true,
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
        // Handle profile completion flag
        if (req.body.isProfileComplete !== undefined) {
            user.isProfileComplete = req.body.isProfileComplete;
        }

        // ✅ Skip validation to prevent errors with existing savedAddress subdocuments
        // that don't have new required fields (fullName, email, phone)
        const updatedUser = await user.save({ validateBeforeSave: false });

        const token = generateToken(user._id, user.name, user.isAdmin);
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            isAdmin: updatedUser.isAdmin,
            isProfileComplete: updatedUser.isProfileComplete,
            authMethod: updatedUser.authMethod || 'password',
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
        const token = generateToken(user._id, user.name, user.isAdmin);
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
        // ✅ Token removed from response body
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isAdmin: user.isAdmin,
            authMethod: user.authMethod || 'password',
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
            // If user was OTP-only, now they have a password
            if (user.authMethod === 'otp') {
                user.authMethod = 'password';
            }
        }
        const updatedUser = await user.save();
        const token = generateToken(
            updatedUser._id,
            updatedUser.name,
            updatedUser.isAdmin
        );
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            isAdmin: updatedUser.isAdmin,
            authMethod: updatedUser.authMethod || 'password',
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
    const pageSize = 30;
    const { keyword } = req.query;
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
            email: {
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
    const count = await User.countDocuments({
        $or: [
            { ...searchKeyword },
            { ...searchKeywordTwo },
            { ...searchKeywordThree },
        ],
    });
    const users = await User.find({
        $or: [
            { ...searchKeyword },
            { ...searchKeywordTwo },
            { ...searchKeywordThree },
        ],
    })
        .sort({ createdAt: -1 })
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
        user.savedAddress = [...req.body.savedAddress] || [
            ...user.savedAddress,
        ];
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
// @desc Get User Saved Addresses
// @route GET /api/users/shippingAddress
// @access private
const getShippingAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        // ✅ Normalize old addresses (backward compatibility)
        const normalizedAddresses = (user.savedAddress || []).map((addr) => ({
            _id: addr._id,
            fullName: addr.fullName || user.name,
            email: addr.email || user.email,
            phone: addr.phone || user.phone,
            address: addr.address,
            city: addr.city,
            state: addr.state,
            postalCode: addr.postalCode,
            country: addr.country || 'India',
            label: addr.label || 'Home',
            isDefault: addr.isDefault || false,
            createdAt: addr.createdAt,
            updatedAt: addr.updatedAt,
        }));
        res.json({
            success: true,
            savedAddresses: normalizedAddresses,
            total: normalizedAddresses.length,
        });
    } else {
        res.status(404);
        throw new Error('User Not Found');
    }
});
// @desc Save User Shipping Address
// @route POST /api/users/shippingAddress
// @access private
const saveUserShippingAddress = asyncHandler(async (req, res) => {
    const { data } = req.body;
    if (
        !data ||
        !data.address ||
        !data.city ||
        !data.state ||
        !data.postalCode
    ) {
        res.status(400);
        throw new Error('Missing required address fields');
    }
    // ✅ Use findByIdAndUpdate to avoid validation entirely
    const result = await User.findByIdAndUpdate(
        req.user._id,
        {
            $push: {
                savedAddress: {
                    _id: new mongoose.Types.ObjectId(),
                    fullName: data.fullName,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    postalCode: data.postalCode,
                    country: data.country || 'India',
                    label: data.label || 'Home',
                    isDefault: data.isDefault || false,
                },
            },
        },
        {
            new: true,
            runValidators: false, // ✅ Skip validators
            returnDocument: 'after', // Return updated document
        }
    );
    if (!result) {
        res.status(404);
        throw new Error('User Not Found');
    }
    // ✅ Get the newly added address (last one)
    const newAddress = result.savedAddress[result.savedAddress.length - 1];
    res.status(201).json({
        success: true,
        message: 'Address saved successfully',
        address: newAddress,
    });
});
const updateShippingAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params;
    const { data } = req.body;
    if (
        !data ||
        !data.address ||
        !data.city ||
        !data.state ||
        !data.postalCode
    ) {
        res.status(400);
        throw new Error('Missing required address fields');
    }
    // ✅ Use findByIdAndUpdate with field updates
    const result = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                'savedAddress.$[elem].fullName': data.fullName,
                'savedAddress.$[elem].email': data.email,
                'savedAddress.$[elem].phone': data.phone,
                'savedAddress.$[elem].address': data.address,
                'savedAddress.$[elem].city': data.city,
                'savedAddress.$[elem].state': data.state,
                'savedAddress.$[elem].postalCode': data.postalCode,
                'savedAddress.$[elem].country': data.country || 'India',
                'savedAddress.$[elem].label': data.label || 'Home',
                'savedAddress.$[elem].isDefault': data.isDefault || false,
                'savedAddress.$[elem].updatedAt': new Date(),
            },
        },
        {
            arrayFilters: [{ 'elem._id': addressId }],
            new: true,
            runValidators: false,
        }
    );
    if (!result) {
        res.status(404);
        throw new Error('Address not found');
    }
    const updatedAddress = result.savedAddress.find(
        (addr) => addr._id.toString() === addressId
    );
    res.json({
        success: true,
        message: 'Address updated successfully',
        address: updatedAddress,
    });
});
// @desc Delete Shipping Address
// @route DELETE /api/users/shippingAddress/:addressId
// @access private
const deleteShippingAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const { addressId } = req.params;
    if (!user) {
        res.status(404);
        throw new Error('User Not Found');
    }
    // ✅ Use MongoDB's $pull operator (most efficient)
    const result = await User.findByIdAndUpdate(
        req.user._id,
        {
            $pull: {
                savedAddress: { _id: addressId },
            },
        },
        { new: true, runValidators: false } // ✅ Skip validators on existing data
    );
    if (!result) {
        res.status(404);
        throw new Error('Failed to delete address');
    }
    res.json({
        success: true,
        message: 'Address deleted successfully',
        savedAddresses: result.savedAddress,
    });
});

/**
 * @desc Set password for OTP-registered users who don't have one
 * @route POST /api/users/set-password
 * @access Private
 */
const setPassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

    // Validate request body
    if (!newPassword) {
        res.status(400);
        throw new Error('New password is required');
    }

    // Validate new password strength
    if (newPassword.length < 8) {
        res.status(400);
        throw new Error('Password must be at least 8 characters long');
    }

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Check if user already has a password (if they do, they should use change-password)
    if (user.password) {
        res.status(400);
        throw new Error('Password already set. Use change password instead.');
    }

    // Set password and update authMethod
    user.password = newPassword;
    user.authMethod = 'password'; // Now they can use password login too
    await user.save();

    // Generate new token
    const token = generateToken(user._id, user.name, user.isAdmin);
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    console.log(`[Auth] Password set for OTP user: ${user._id}`);

    res.json({
        success: true,
        message: 'Password set successfully',
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        authMethod: user.authMethod,
        token,
    });
});

export {
    deleteShippingAddress,
    updateShippingAddress,
    getShippingAddress,
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
    getCurrentUser,
    logout,
    changePassword,
    setPassword,
};


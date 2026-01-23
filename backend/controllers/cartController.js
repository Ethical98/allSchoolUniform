import asyncHandler from 'express-async-handler';
import Cart from '../models/CartModel.js';
import { normalizeUrl } from '../utils/normalizeUrl.js';

// Helper to normalize cart items images
const normalizeCartItems = (cartItems) => {
    if (!Array.isArray(cartItems)) return cartItems;
    return cartItems.map((item) => ({
        ...item.toObject ? item.toObject() : item,
        image: normalizeUrl(item.image),
    }));
};

// @desc Add item to cart
// @route POST /api/cart/add
// @access Private
const addToCart = asyncHandler(async (req, res) => {
    const { addItem } = req.body;

    // ✅ Validate input
    if (!addItem || (Array.isArray(addItem) && addItem.length === 0)) {
        res.status(400);
        throw new Error('No cart items to add');
    }

    try {
        // ✅ Use atomic findOneAndUpdate with upsert to prevent race conditions
        // This handles the case where multiple add-to-cart calls happen simultaneously

        // First, try to find cart and check if item exists
        const existingCart = await Cart.findOne({ user: req.user._id });

        if (existingCart) {
            // Cart exists - check if item already in cart
            const existingItemIndex = existingCart.cartItems.findIndex(
                (x) => x._id?.toString() === addItem._id?.toString() ||
                    x.sizeVariant?.toString() === addItem.sizeVariant?.toString()
            );

            if (existingItemIndex !== -1) {
                // ✅ Item exists - update it atomically
                const updatePath = `cartItems.${existingItemIndex}`;
                const updatedCart = await Cart.findOneAndUpdate(
                    { user: req.user._id },
                    {
                        $set: {
                            [updatePath]: addItem,
                            username: req.user.name,
                            contact: req.user.phone,
                        }
                    },
                    { new: true }
                );

                return res.json({
                    success: true,
                    message: 'Item updated in cart',
                    cartItems: normalizeCartItems(updatedCart.cartItems),
                    cartId: updatedCart._id,
                    _id: updatedCart._id,
                });
            } else {
                // ✅ New item - add to cart atomically
                const updatedCart = await Cart.findOneAndUpdate(
                    { user: req.user._id },
                    {
                        $push: { cartItems: addItem },
                        $set: { username: req.user.name, contact: req.user.phone }
                    },
                    { new: true }
                );

                return res.status(201).json({
                    success: true,
                    message: 'Item added to cart',
                    cartItems: normalizeCartItems(updatedCart.cartItems),
                    cartId: updatedCart._id,
                    _id: updatedCart._id,
                });
            }
        } else {
            // ✅ No cart exists - create one atomically using upsert
            // This prevents race condition when multiple requests try to create cart simultaneously
            const updatedCart = await Cart.findOneAndUpdate(
                { user: req.user._id },
                {
                    $setOnInsert: {
                        user: req.user._id,
                        cartItems: [addItem],
                        username: req.user.name,
                        contact: req.user.phone,
                    }
                },
                {
                    new: true,
                    upsert: true  // Creates if doesn't exist
                }
            );

            // Check if item was actually inserted (upsert created new doc)
            // If doc already existed, we need to add the item
            if (updatedCart.cartItems.length === 0 ||
                !updatedCart.cartItems.some(item =>
                    item._id?.toString() === addItem._id?.toString() ||
                    item.sizeVariant?.toString() === addItem.sizeVariant?.toString()
                )) {
                // Race condition: another request created the cart, now add item
                const finalCart = await Cart.findOneAndUpdate(
                    { user: req.user._id },
                    {
                        $push: { cartItems: addItem },
                        $set: { username: req.user.name, contact: req.user.phone }
                    },
                    { new: true }
                );

                return res.status(201).json({
                    success: true,
                    message: 'Cart created and item added',
                    cartItems: normalizeCartItems(finalCart.cartItems),
                    cartId: finalCart._id,
                    _id: finalCart._id,
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Cart created and item added',
                cartItems: normalizeCartItems(updatedCart.cartItems),
                cartId: updatedCart._id,
                _id: updatedCart._id,
            });
        }
    } catch (error) {
        console.error('[Cart Controller] Add error:', error);

        // Handle duplicate key error from race condition more gracefully
        if (error.code === 11000) {
            // Retry once - cart was created by concurrent request
            try {
                const retryCart = await Cart.findOneAndUpdate(
                    { user: req.user._id },
                    {
                        $push: { cartItems: addItem },
                        $set: { username: req.user.name, contact: req.user.phone }
                    },
                    { new: true }
                );

                return res.status(201).json({
                    success: true,
                    message: 'Item added to cart',
                    cartItems: normalizeCartItems(retryCart.cartItems),
                    cartId: retryCart._id,
                    _id: retryCart._id,
                });
            } catch (retryError) {
                console.error('[Cart Controller] Retry error:', retryError);
            }
        }

        res.status(500);
        throw new Error(error.message || 'Failed to add item to cart');
    }
});


// @desc Remove item from cart
// @route POST /api/cart/remove
// @access Private
const cartItemRemove = asyncHandler(async (req, res) => {
    // ✅ Accept ID from body (as frontend sends it)
    const { id } = req.body;

    if (!id) {
        res.status(400);
        throw new Error('Item ID is required');
    }

    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            res.status(404);
            throw new Error('Cart not found');
        }

        // ✅ Filter out the item
        const initialLength = cart.cartItems.length;
        cart.cartItems = cart.cartItems.filter(
            (item) =>
                item._id?.toString() !== id &&
                item.sizeVariant?.toString() !== id
        );

        if (cart.cartItems.length === initialLength) {
            res.status(404);
            throw new Error('Item not found in cart');
        }

        // ✅ Delete cart if empty, otherwise save
        if (cart.cartItems.length === 0) {
            await Cart.deleteOne({ user: req.user._id });
            res.json({
                success: true,
                message: 'Cart cleared',
                cartItems: [],
            });
        } else {
            await cart.save();
            res.json({
                success: true,
                message: 'Item removed from cart',
                cartItems: normalizeCartItems(cart.cartItems),
                cartId: cart._id,
            });
        }
    } catch (error) {
        console.error('[Cart Controller] Remove error:', error);
        res.status(500);
        throw new Error(error.message || 'Failed to remove item');
    }
});

// @desc Get current cart
// @route GET /api/cart/get
// @access Private
const getCart = asyncHandler(async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (cart) {
            res.json({
                success: true,
                cartItems: normalizeCartItems(cart.cartItems) || [],
                cartId: cart._id,
                _id: cart._id,
                username: cart.username,
                contact: cart.contact,
            });
        } else {
            res.json({
                success: true,
                cartItems: [],
                cartId: null,
                _id: null,
            });
        }
    } catch (error) {
        console.error('[Cart Controller] Get cart error:', error);
        res.status(500);
        throw new Error(error.message || 'Failed to fetch cart');
    }
});

// @desc Merge/sync local cart with database
// @route POST /api/cart
// @access Private
const mergeCart = asyncHandler(async (req, res) => {
    const { cartItems } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        res.status(400);
        throw new Error('No cart items to merge');
    }

    const MAX_QUANTITY_PER_ITEM = 99;

    try {
        let cart = await Cart.findOne({ user: req.user._id });
        if (cart) {
            // ✅ Merge logic: Update quantities for existing items
            cartItems.forEach((newItem) => {
                const existingItem = cart.cartItems.find(
                    (x) => x._id?.toString() === newItem._id?.toString()
                );

                if (existingItem) {
                    // ✅ Item exists - update quantity and item data
                    const currentQty = existingItem.qty || 0;
                    const newQty = newItem.qty || 1;
                    const totalQty = currentQty + newQty;

                    // ✅ Update item properties directly
                    Object.assign(existingItem, {
                        ...newItem,
                        qty: Math.min(totalQty, MAX_QUANTITY_PER_ITEM),
                    });

                    // Log if quantity was capped
                    if (totalQty > MAX_QUANTITY_PER_ITEM) {
                        console.log(
                            `[Cart] Quantity capped at ${MAX_QUANTITY_PER_ITEM} for product ${newItem.product}`
                        );
                    }
                } else {
                    // ✅ New item - add to cart with quantity limit
                    cart.cartItems.push({
                        ...newItem,
                        qty: Math.min(newItem.qty || 1, MAX_QUANTITY_PER_ITEM),
                    });
                }
            });

            cart.username = req.user.name;
            cart.contact = req.user.phone;
            await cart.save();

            res.json({
                success: true,
                message: 'Cart merged successfully',
                cartItems: normalizeCartItems(cart.cartItems),
                cartId: cart._id,
            });
        } else {
            // ✅ Create new cart with quantity limits
            const validatedItems = cartItems.map((item) => ({
                ...item,
                qty: Math.min(item.qty || 1, MAX_QUANTITY_PER_ITEM),
            }));

            cart = new Cart({
                cartItems: validatedItems,
                user: req.user._id,
                username: req.user.name,
                contact: req.user.phone,
            });

            await cart.save();

            res.json({
                success: true,
                message: 'Cart created',
                cartItems: normalizeCartItems(cart.cartItems),
                cartId: cart._id,
            });
        }
    } catch (error) {
        console.error('[Cart Controller] Merge error:', error);
        res.status(500);
        throw new Error(error.message || 'Failed to merge cart');
    }
});

// @desc Clear/reset cart
// @route POST /api/cart/reset
// @access Private
const resetCart = asyncHandler(async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            res.json({
                success: true,
                message: 'Cart already empty',
            });
            return;
        }

        await Cart.deleteOne({ user: req.user._id });

        res.json({
            success: true,
            message: 'Cart cleared successfully',
        });
    } catch (error) {
        console.error('[Cart Controller] Reset error:', error);
        res.status(500);
        throw new Error(error.message || 'Failed to reset cart');
    }
});

// @desc Update item quantity
// @route POST /api/cart/update
// @access Private
const updateItemQuantity = asyncHandler(async (req, res) => {
    const { id, qty } = req.body;

    if (!id) {
        res.status(400);
        throw new Error('Item ID is required');
    }

    if (!qty || qty < 0) {
        res.status(400);
        throw new Error('Valid quantity is required');
    }

    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            res.status(404);
            throw new Error('Cart not found');
        }

        // ✅ Find item by ID or sizeVariant
        const itemIndex = cart.cartItems.findIndex(
            (item) =>
                item._id?.toString() === id ||
                item.sizeVariant?.toString() === id
        );

        if (itemIndex === -1) {
            res.status(404);
            throw new Error('Item not found in cart');
        }

        // ✅ Update quantity
        cart.cartItems[itemIndex].qty = qty;

        await cart.save();

        res.json({
            success: true,
            message: 'Quantity updated',
            cartItems: normalizeCartItems(cart.cartItems),
            cartId: cart._id,
        });
    } catch (error) {
        console.error('[Cart Controller] Update error:', error);
        res.status(500);
        throw new Error(error.message || 'Failed to update quantity');
    }
});

export {
    addToCart,
    cartItemRemove,
    mergeCart,
    getCart,
    resetCart,
    updateItemQuantity,
};

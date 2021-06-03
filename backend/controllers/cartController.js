import asyncHandler from 'express-async-handler';
import Cart from '../models/CartModel.js';

// @desc Add T0 Cart
// @route GET /api/cart/add
// @access Private
const addToCart = asyncHandler(async (req, res) => {
  const { addItem } = req.body;

  if (addItem && addItem.length === 0) {
    res.status(400);
    throw new Error('No cart items to add');
  } else {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      const existItem = cart.cartItems.find(
        (x) => x.product == addItem.product
      );

      if (existItem) {
        cart.cartItems = cart.cartItems.map((x) =>
          x.product == existItem.product ? addItem : x
        );
        const items = await cart.save();
        res.json(items.cartItems);
      } else {
        cart.cartItems = [...cart.cartItems, addItem];
        const items = await cart.save();
        res.json(items.cartItems);
      }
    } else {
      const cart = new Cart({
        cartItems: addItem,
        user: req.user._id,
      });
      await cart.save();
      res.json({ Message: 'ITEM ADDED' });
    }
  }
});



// @desc Remove From Cart
// @route GET /api/cart/remove
// @access Private
const cartItemRemove = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    res.status(400);
    throw new Error('No Item to Delete From Cart');
  } else {
    const cart = await Cart.findOne({ user: req.user._id });

    cart.cartItems = cart.cartItems.filter((x) => x.product != id);
    if (cart.cartItems.length == 0) {
      await Cart.deleteOne({ user: req.user._id });

      res.json({ Message: 'Cart Cleared' });
    } else {
      await cart.save();
      res.json({ Message: 'Item Deleted' });
    }
  }
});

// @desc get Cart for Realtime
// @route GET /api/cart/get
// @access Private
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    
    res.json(cart.cartItems);
  } else {
    res.json([]);
  }
});

// @desc Sync databse cart
// @route GET /api/cart/
// @access Private
const mergeCart = asyncHandler(async (req, res) => {
  const { cartItems } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.cartItems.map((x) =>
      cartItems.map(
        (item) => (x.qty = x.product == item.product ? x.qty + item.qty : x.qty)
      )
    );
    await cart.save();
    const products = cartItems.filter(
      (itemToAdd) =>
        !cart.cartItems.some(
          (addedItem) => itemToAdd.product == addedItem.product
        )
    );
    cart.cartItems = [...cart.cartItems, ...products];
    const finalCart = await cart.save();
    res.json(finalCart.cartItems);
  } else {
    const cart = new Cart({
      cartItems,
      user: req.user._id,
    });
    const addedCart = await cart.save();
    res.json(addedCart.cartItems);
  }
});

export { addToCart, cartItemRemove, mergeCart, getCart };

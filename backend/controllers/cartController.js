import asyncHandler from 'express-async-handler';
import Cart from '../models/CartModel.js';

// @desc Add T0 Cart
// @route POST /api/cart/add
// @access Private
const addToCart = asyncHandler(async (req, res) => {
  const { addItem } = req.body;

  if (addItem && addItem.length === 0) {
    res.status(400);
    throw new Error('No cart items to add');
  } else {
    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (cart) {
      const existItem = cart.cartItems.find((x) => x._id == addItem._id);

      if (existItem) {
        cart.cartItems = cart.cartItems.map((x) =>
          x._id == existItem._id ? addItem : x
        );

        const items = await cart.save();

        res.json(items.cartItems);
      } else {
        cart.cartItems = [...cart.cartItems, addItem];
        cart.username = req.user.name;
        cart.contact = req.user.phone;
        const items = await cart.save();
        res.json(items.cartItems);
      }
    } else {
      const cart = new Cart({
        cartItems: addItem,
        user: req.user._id,
        username: req.user.name,
        contact: req.user.phone,
      });

      await cart.save();
      res.json({ Message: 'ITEM ADDED' });
      // res.json(cart.cartItems);
    }
  }
});

// @desc Remove From Cart
// @route DELETE /api/cart/remove/:id
// @access Private
const cartItemRemove = asyncHandler(async (req, res) => {
  const id = req.query.id;

  if (!id) {
    res.status(400);
    throw new Error('No Item to Delete From Cart');
  } else {
    const cart = await Cart.findOne({ user: req.user._id });

    cart.cartItems = cart.cartItems.filter((x) => x.id != id);
    await cart.save();

    if (cart.cartItems.length == 0) {
      await Cart.deleteOne({ user: req.user._id });

      res.json({ Message: 'Cart Cleared' });
    } else {
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
    res.json(cart);
  } else {
    res.json({ cartItems: [], cartId: '' });
  }
});

// @desc Sync databse cart
// @route POST /api/cart/
// @access Private
const mergeCart = asyncHandler(async (req, res) => {
  const { cartItems } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.cartItems.map((x) =>
      cartItems.map(
        (item) =>
          (x.qty =
            x.product == item.product && x.size == item.size
              ? x.qty + item.qty
              : x.qty)
      )
    );

    const products = cartItems.filter(
      (itemToAdd) =>
        !cart.cartItems.some((addedItem) =>
          itemToAdd.product == addedItem.product
            ? itemToAdd.size == addedItem.size
            : itemToAdd.product == addedItem.product
        )
    );

    cart.cartItems = [...cart.cartItems, ...products];
    cart.username = req.user.name;
    cart.contact = req.user.phone;
    const finalCart = await cart.save();
    res.json(finalCart.cartItems);
  } else {
    const cart = new Cart({
      cartItems,
      user: req.user._id,
    });
    cart.username = req.user.name;
    cart.contact = req.user.phone;
    const addedCart = await cart.save();
    res.json(addedCart.cartItems);
  }
});

// @desc Cart Reset
// @route POST /api/cart/reset
// @access Private
const resetCart = asyncHandler(async (req, res) => {
  if (!req.user._id) {
    res.status(403);
    throw new Error('Cart Is Empty');
  } else {
    await Cart.deleteOne({ user: req.user._id });
    res.json('Cart Reset');
  }
});

export { addToCart, cartItemRemove, mergeCart, getCart, resetCart };

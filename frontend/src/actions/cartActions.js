import axios from 'axios';
import {
  CART_ADD_ITEM,
  CART_REMOVE_ITEM,
  CART_SAVE_PAYMENT_METHOD,
  CART_SAVE_SHIPPING_ADDRESS,
  CART_GET_FROM_DATABASE,
  CART_ITEM_FAIL,
  CART_RESET_REQUEST,
  CART_RESET_FAIL,
  CART_RESET_SUCCESS,
  CART_GET_SHIPPING_ADDRESS,
  CART_REQUEST_SHIPPING_ADDRESS,
  CART_FAIL_SHIPPING_ADDRESS,
} from '../constants/cartConstants';
import { encryptData } from '../utils/Crypto';
import dotenv from 'dotenv';
dotenv.config();

const salt = process.env.REACT_APP_CRYPTO_SALT;

export const addToCart = (id, index, qty) => async (dispatch, getState) => {
  try {
    const { data } = await axios.get(`/api/products/${id}`);
    const {
      userLogin: { userInfo },
    } = getState();

    if (userInfo) {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const addItem = {
        _id: data.size[index]._id,
        product: data._id,
        name: data.name,
        image: data.image,
        size: data.size[index].size,
        price: data.size[index].price,
        countInStock: data.size[index].countInStock,
        qty,
        index,
      };

      dispatch({
        type: CART_ADD_ITEM,
        payload: addItem,
      });
      await axios.post(`/api/cart/add`, { addItem }, config);
    } else {
      dispatch({
        type: CART_ADD_ITEM,
        payload: {
          _id: data.size[index]._id,
          product: data._id,
          name: data.name,
          price: data.size[index].price,
          image: data.image,
          countInStock: data.size[index].countInStock,
          size: data.size[index].size,
          qty,
          index,
        },
      });
    }
  } catch (error) {
    dispatch({
      type: CART_ITEM_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }

  localStorage.setItem(
    'cartItems',
    encryptData(JSON.stringify(getState().cart.cartItems), salt)
  );
};

export const removeFromCart = (id) => async (dispatch, getState) => {
  try {
    const {
      userLogin: { userInfo },
    } = getState();

    if (userInfo) {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.post(`/api/cart/remove`, { id }, config);
      dispatch({
        type: CART_REMOVE_ITEM,
        payload: id,
      });
    } else {
      dispatch({
        type: CART_REMOVE_ITEM,
        payload: id,
      });
    }
  } catch (error) {
    dispatch({
      type: CART_ITEM_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }

  localStorage.setItem(
    'cartItems',
    encryptData(JSON.stringify(getState().cart.cartItems), salt)
  );
};

export const mergeCartWithDatabase = () => async (dispatch, getState) => {
  try {
    const {
      userLogin: { userInfo },
    } = getState();

    if (userInfo) {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const {
        cart: { cartItems },
      } = getState();

      const { data } = await axios.post('/api/cart/', { cartItems }, config);

      dispatch({
        type: CART_GET_FROM_DATABASE,
        payload: data,
      });
      localStorage.setItem(
        'cartItems',
        encryptData(JSON.stringify(getState().cart.cartItems), salt)
      );
      localStorage.setItem(
        'cartSuccess',
        JSON.stringify(getState().cart.cartSuccess)
      );
    }
  } catch (error) {
    dispatch({
      type: CART_ITEM_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const getCartFromDatabase = () => async (dispatch, getState) => {
  const {
    userLogin: { userInfo },
  } = getState();

  if (userInfo) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get('/api/cart/get', config);

    dispatch({
      type: CART_GET_FROM_DATABASE,
      payload: data.cartItems,
      cartId: data._id,
    });

    localStorage.setItem(
      'cartItems',
      encryptData(JSON.stringify(getState().cart.cartItems), salt)
    );
    localStorage.setItem(
      'cartSuccess',
      JSON.stringify(getState().cart.cartSuccess)
    );
  }
};

export const getSavedAddress = () => async (dispatch, getState) => {
  dispatch({
    type: CART_REQUEST_SHIPPING_ADDRESS,
  });
  try {
    const {
      userLogin: { userInfo },
    } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get('/api/users/shippingAddress', config);

    dispatch({
      type: CART_GET_SHIPPING_ADDRESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: CART_FAIL_SHIPPING_ADDRESS,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const saveShippingAddressDatabase =
  (data) => async (dispatch, getState) => {
    try {
      const {
        userLogin: { userInfo },
      } = getState();
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      await axios.post('/api/users/shippingAddress', { data }, config);
      dispatch({
        type: CART_SAVE_SHIPPING_ADDRESS,
        payload: data,
      });
      localStorage.setItem(
        'shippingAddress',
        encryptData(JSON.stringify(data), salt)
      );
    } catch (error) {
      dispatch({
        type: CART_FAIL_SHIPPING_ADDRESS,
        payload:
          error.response && error.response.data.message
            ? error.response.data.message
            : error.message,
      });
    }
  };

export const saveShippingAddress = (data) => (dispatch) => {
  dispatch({
    type: CART_SAVE_SHIPPING_ADDRESS,
    payload: data,
  });

  // }
  localStorage.setItem(
    'shippingAddress',
    encryptData(JSON.stringify(data), salt)
  );
};

export const savePaymentMethod = (data) => (dispatch) => {
  dispatch({
    type: CART_SAVE_PAYMENT_METHOD,
    payload: data,
  });

  // localStorage.setItem('paymentMethod', JSON.stringify(data));
};

export const clearCartFromDatabase = () => async (dispatch, getState) => {
  try {
    dispatch({
      type: CART_RESET_REQUEST,
    });
    const {
      userLogin: { userInfo },
    } = getState();

    localStorage.removeItem('shippingAddress');
    localStorage.removeItem('cartItems');
    getState().cart.cartItems = [];

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    await axios.get('/api/cart/clear', config);

    dispatch({
      type: CART_RESET_SUCCESS,
    });
  } catch (error) {
    dispatch({
      type: CART_RESET_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

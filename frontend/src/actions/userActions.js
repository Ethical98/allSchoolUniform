import axios from 'axios';
import firebase from '../utils/firebase';
import {
  USER_LOGIN_FAIL,
  USER_LOGIN_REQUEST,
  USER_LOGIN_SUCCESS,
  USER_LOGOUT,
  USER_OTP_REQUEST,
  USER_OTP_SENT,
  USER_OTP_FAIL,
  USER_OTP_SUCCESS,
  USER_REGISTER_REQUEST,
  USER_REGISTER_SUCCESS,
  USER_REGISTER_FAIL,
  USER_DETAILS_REQUEST,
  USER_DETAILS_SUCCESS,
  USER_DETAILS_FAIL,
  USER_UPDATE_PROFILE_REQUEST,
  USER_UPDATE_PROFILE_SUCCESS,
  USER_UPDATE_PROFILE_FAIL,
  USER_OTP_RESET,
  USER_OTP_CANCEL,
  USER_PASSWORD_RESET_REQUEST,
  USER_PASSWORD_RESET_SUCCESS,
  USER_PASSWORD_RESET_FAIL,
  USER_PASSWORD_RESET_CLEAR,
  USER_DETAILS_RESET,
  USER_REGISTER_RESET,
  USER_LIST_REQUEST,
  USER_LIST_FAIL,
  USER_LIST_SUCCESS,
  USER_LIST_RESET,
  USER_DELETE_SUCCESS,
  USER_DELETE_FAIL,
  USER_DELETE_REQUEST,
  USER_UPDATE_FAIL,
  USER_UPDATE_SUCCESS,
  USER_UPDATE_REQUEST,
} from '../constants/userConstants';
import { encryptData } from '../utils/Crypto';
import dotenv from 'dotenv';
import { ORDER_LIST_MY_RESET } from '../constants/orderConstants';
import { CART_ITEMS_RESET } from '../constants/cartConstants';
// import 'firebase/auth';
// import firebase1 from 'firebase/app';
// import firebase from 'firebase';

dotenv.config();

const salt = process.env.REACT_APP_CRYPTO_SALT;

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch({
      type: USER_LOGIN_REQUEST,
    });

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const { data } = await axios.post(
      '/api/users/login',
      { email, password },
      config
    );

    dispatch({
      type: USER_LOGIN_SUCCESS,
      payload: data,
    });

    localStorage.setItem('userInfo', encryptData(JSON.stringify(data), salt));
  } catch (error) {
    dispatch({
      type: USER_LOGIN_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const loginByPhone = (phone, password) => async (dispatch) => {
  try {
    dispatch({
      type: USER_LOGIN_REQUEST,
    });

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const { data } = await axios.post(
      '/api/users/loginByPhone',
      { phone, password },
      config
    );

    dispatch({
      type: USER_LOGIN_SUCCESS,
      payload: data,
    });

    localStorage.setItem('userInfo', encryptData(JSON.stringify(data), salt));
  } catch (error) {
    dispatch({
      type: USER_LOGIN_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const logout = () => (dispatch, getState) => {
  localStorage.removeItem('userInfo');
  localStorage.removeItem('cartItems');
  localStorage.removeItem('shippingAddress');
  localStorage.removeItem('cartSuccess');

  dispatch({ type: USER_LOGOUT });
  dispatch({ type: USER_DETAILS_RESET });
  dispatch({ type: ORDER_LIST_MY_RESET });
  dispatch({ type: USER_OTP_RESET });
  dispatch({ type: USER_REGISTER_RESET });
  dispatch({ type: CART_ITEMS_RESET });
  dispatch({ type: USER_LIST_RESET });
};

export const register = (name, email, phone, password) => async (dispatch) => {
  try {
    dispatch({
      type: USER_REGISTER_REQUEST,
    });

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const { data } = await axios.post(
      '/api/users/',
      { name, email, phone, password },
      config
    );
    await firebase.auth().createUserWithEmailAndPassword(email, password);

    dispatch({
      type: USER_REGISTER_SUCCESS,
      payload: data,
    });

    dispatch({
      type: USER_LOGIN_SUCCESS,
      payload: data,
    });

    localStorage.setItem('userInfo', encryptData(JSON.stringify(data), salt));
  } catch (error) {
    dispatch({
      type: USER_REGISTER_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const getOtpWithEmail = (email) => async (dispatch) => {
  try {
    dispatch({
      type: USER_OTP_REQUEST,
    });

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const { data } = await axios.post(
      '/api/users/getUserPhone',
      { email },
      config
    );

    if (data) {
      const phoneNumber = '+91' + data.phone;
      const appVerifier = window.recaptchaVerifier;

      const confirmationResult = await firebase
        .auth()
        .signInWithPhoneNumber(phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      dispatch({
        type: USER_OTP_SENT,
        payload: data.phone,
      });
    }
  } catch (error) {
    dispatch({
      type: USER_OTP_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const getUserDetails = (id) => async (dispatch, getState) => {
  try {
    dispatch({
      type: USER_DETAILS_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get(`/api/users/${id}`, config);
    dispatch({
      type: USER_DETAILS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: USER_DETAILS_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const updateUserProfile = (user) => async (dispatch, getState) => {
  try {
    dispatch({
      type: USER_UPDATE_PROFILE_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.put(`/api/users/profile`, user, config);
    dispatch({
      type: USER_UPDATE_PROFILE_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: USER_UPDATE_PROFILE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const loginByOTP = (phone) => async (dispatch) => {
  try {
    dispatch({
      type: USER_LOGIN_REQUEST,
    });

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const { data } = await axios.post(
      '/api/users/loginByOtp',
      { phone },
      config
    );

    dispatch({
      type: USER_LOGIN_SUCCESS,
      payload: data,
    });

    localStorage.setItem('userInfo', encryptData(JSON.stringify(data), salt));
  } catch (error) {
    dispatch({
      type: USER_LOGIN_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const configureCaptcha = (id) => {
  window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(id, {
    size: 'invisible',
    callback: (response) => {},
    defaultCountry: 'IN',
  });
};

export const getOTP = (phone) => async (dispatch) => {
  try {
    var phoneNumber;
    dispatch({
      type: USER_OTP_REQUEST,
      payload: phone,
    });
    if (phone.toString().length > 10) {
      if (phone.toString().startsWith('+91')) {
        phoneNumber = phone;
      } else {
        phoneNumber = '+91' + phone.toString().substring(1);
      }
    } else {
      phoneNumber = '+91' + phone;
    }

    const appVerifier = window.recaptchaVerifier;

    const confirmationResult = await firebase
      .auth()
      .signInWithPhoneNumber(phoneNumber, appVerifier);
    window.confirmationResult = confirmationResult;
    dispatch({
      type: USER_OTP_SENT,
      payload: phone,
    });
    // window.recaptchaVerifier.render().then((widgetId) => {
    //   window.recaptchaVerifier.reset(widgetId);
    // });
  } catch (error) {
    // window.recaptchaVerifier.render().then((widgetId) => {
    //   window.recaptchaVerifier.reset(widgetId);
    // });

    dispatch({
      type: USER_OTP_FAIL,
      payload: error,
    });
  }
};

export const submitOTP = (otp) => async (dispatch) => {
  const code = otp;

  try {
    const result = await window.confirmationResult.confirm(code);
    const user = result.user;
    if (user) {
      dispatch({
        type: USER_OTP_SUCCESS,
      });
    }
  } catch (error) {
    // window.recaptchaVerifier.render().then((widgetId) => {
    //   window.recaptchaVerifier.reset(widgetId);
    // });

    dispatch({
      type: USER_OTP_FAIL,
      payload: error,
    });
  }
};

export const resetOtp = () => (dispatch) => {
  dispatch({
    type: USER_OTP_RESET,
  });
  // window.recaptchaVerifier.render().then((widgetId) => {
  //   window.recaptchaVerifier.reset(widgetId);
  // });
};

export const cancelOtpRequest = (phone) => (dispatch) => {
  dispatch({
    type: USER_OTP_CANCEL,
    payload: phone,
  });
};

export const forgotPassword = (email) => async (dispatch) => {
  try {
    dispatch({ type: USER_PASSWORD_RESET_REQUEST });

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    await axios.post('/api/users/forgotPassword', { email }, config);

    await firebase.auth().sendPasswordResetEmail(email);
    localStorage.setItem('RE', encryptData(JSON.stringify(email), salt));
    dispatch({ type: USER_PASSWORD_RESET_SUCCESS });
  } catch (error) {
    dispatch({
      type: USER_PASSWORD_RESET_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const resetPassword = (password, email) => async (dispatch) => {
  try {
    dispatch({
      type: USER_UPDATE_PROFILE_REQUEST,
    });

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const { data } = await axios.post(
      `/api/users/resetPassword`,
      { password, email },
      config
    );
    dispatch({
      type: USER_UPDATE_PROFILE_SUCCESS,
      payload: data,
    });

    dispatch({
      type: USER_LOGIN_SUCCESS,
      payload: data,
    });

    localStorage.setItem('userInfo', encryptData(JSON.stringify(data), salt));
  } catch (error) {
    dispatch({
      type: USER_UPDATE_PROFILE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const clearResetPasswordRequest = () => async (dispatch) => {
  dispatch({ type: USER_PASSWORD_RESET_CLEAR });
  localStorage.removeItem('RE');
};

export const listUsers =
  (pageNumber = '') =>
  async (dispatch, getState) => {
    try {
      dispatch({
        type: USER_LIST_REQUEST,
      });

      const {
        userLogin: { userInfo },
      } = getState();

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get(
        `/api/users?pageNumber=${pageNumber}`,
        config
      );

      dispatch({
        type: USER_LIST_SUCCESS,
        payload: data,
      });
    } catch (error) {
      dispatch({
        type: USER_LIST_FAIL,
        payload:
          error.response && error.response.data.message
            ? error.response.data.message
            : error.message,
      });
    }
  };

export const deleteUser = (id) => async (dispatch, getState) => {
  try {
    dispatch({
      type: USER_DELETE_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    await axios.delete(`/api/users/${id}`, config);

    dispatch({
      type: USER_DELETE_SUCCESS,
    });
  } catch (error) {
    dispatch({
      type: USER_DELETE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const updateUser = (user) => async (dispatch, getState) => {
  try {
    dispatch({
      type: USER_UPDATE_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        'Content-Type': 'application/json',
      },
    };

    const { data } = await axios.put(`/api/users/${user._id}`, user, config);

    dispatch({
      type: USER_UPDATE_SUCCESS,
    });
    dispatch({
      type: USER_DETAILS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: USER_UPDATE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

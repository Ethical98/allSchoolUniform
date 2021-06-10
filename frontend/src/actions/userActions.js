import axios from 'axios';
import {
  USER_LOGIN_FAIL,
  USER_LOGIN_REQUEST,
  USER_LOGIN_SUCCESS,
  USER_LOGOUT,
  USER_OTP_REQUEST,
  USER_OTP_SENT,
  USER_OTP_VERIFICATION_FAIL,
  USER_OTP_VERIFICATION_SUCCESS,
  // USER_REQUEST_ID,
  // USER_VERIFIED,
  USER_REGISTER_REQUEST,
  USER_REGISTER_SUCCESS,
  USER_REGISTER_FAIL,
  USER_OTP_VERIFICATION_ERROR,
  USER_DETAILS_REQUEST,
  USER_DETAILS_SUCCESS,
  USER_DETAILS_FAIL,
  USER_UPDATE_PROFILE_REQUEST,
  USER_UPDATE_PROFILE_SUCCESS,
  USER_UPDATE_PROFILE_FAIL,
} from '../constants/userConstants';
import { encryptData } from './Crypto';
import dotenv from 'dotenv';
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
  getState().cart.shippingAddress = {};
  getState().cart.cartItems = [];
  getState().userOtpVerification.verified = false;
  getState().cart.cartSuccess = false;
  getState().userRegister.userInfo = [];
  localStorage.setItem(
    'cartSuccess',
    JSON.stringify(getState().cart.cartSuccess)
  );

  dispatch({ type: USER_LOGOUT });
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

export const getOtp = (phone) => async (dispatch) => {
  try {
    dispatch({
      type: USER_OTP_REQUEST,
      payload: phone,
    });

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const { data } = await axios.post('/api/users/getOtp', { phone }, config);
    dispatch({
      type: USER_OTP_SENT,
      payload: data,
      phone: phone,
    });
    // dispatch({
    //   type: USER_REQUEST_ID,
    //   payload: data.request_id,
    // });
  } catch (error) {
    dispatch({
      type: USER_OTP_VERIFICATION_FAIL,
      data: phone,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const verifyOtp = (id, code, phone) => async (dispatch) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const { data } = await axios.post(
      '/api/users/verifyOtp',
      { id, code },
      config
    );
    if (data === id) {
      dispatch({
        type: USER_OTP_VERIFICATION_SUCCESS,
        payload: phone,
      });
    } else {
      dispatch({
        type: USER_OTP_VERIFICATION_ERROR,
        payload: data.message,
        phone: phone,
        id: id,
      });
    }
  } catch (error) {
    dispatch({
      type: USER_OTP_VERIFICATION_FAIL,
      data: phone,
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

// export const recaptchaVerifier = (id,phone) => async (dispatch) => {
//   window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(id, {
//     size: 'invisible',
//     callback: (response) => {
//       // reCAPTCHA solved, allow signInWithPhoneNumber.
//       dispatch({
//         type: USER_OTP_SENT,
//       });
//       onSignInSubmit();
//     },
//   });
// };

// export const onSignInSubmit = (phone, id) => async (dispatch) => {
//   try {
//     recaptchaVerifier(id,phone);
//     const phoneNumber = phone;
//     console.log(phoneNumber);
//     const appVerifier = window.recaptchaVerifier;
//     const confirmationResult = await firebase
//       .auth()
//       .signInWithPhoneNumber(phoneNumber, appVerifier);

//     // SMS sent. Prompt user to type the code from the message, then sign the
//     // user in with confirmationResult.confirm(code).
//     window.confirmationResult = confirmationResult;
//     const code = window.prompt('Enter Otp');
//     try {
//       const result = await confirmationResult.confirm(code);

//       // User signed in successfully.
//       const user = result.user;
//       console.log('User is signed in');
//       // ...
//     } catch (error) {
//       dispatch({
//         type: USER_OTP_VERIFICATION_FAIL,
//         payload:
//           error.response && error.response.data.message
//             ? error.response.data.message
//             : error.message,
//       });
//       // console.log(error);
//       // // User couldn't sign in (bad verification code?)
//       // // ...
//     }
//   } catch (error) {
//     dispatch({
//       type: USER_OTP_VERIFICATION_FAIL,
//       payload:
//         error.response && error.response.data.message
//           ? error.response.data.message
//           : error.message,
//     });
//   }
// };

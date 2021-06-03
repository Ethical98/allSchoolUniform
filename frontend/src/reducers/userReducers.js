import {
  USER_LOGIN_FAIL,
  USER_LOGIN_REQUEST,
  USER_LOGIN_SUCCESS,
  USER_LOGOUT,
  USER_OTP_REQUEST,
  USER_OTP_SENT,
  USER_OTP_VERIFICATION_SUCCESS,
  USER_OTP_VERIFICATION_FAIL,
  USER_OTP_VERIFICATION_ERROR,
  USER_REGISTER_FAIL,
  USER_REGISTER_REQUEST,
  USER_REGISTER_SUCCESS,
  USER_DETAILS_REQUEST,
  USER_DETAILS_SUCCESS,
  USER_DETAILS_FAIL,
  USER_UPDATE_PROFILE_SUCCESS,
  USER_UPDATE_PROFILE_FAIL,
  USER_UPDATE_PROFILE_REQUEST,
} from '../constants/userConstants';

export const userLoginReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_LOGIN_REQUEST:
      return { loading: true };
    case USER_LOGIN_SUCCESS:
      return { loading: false, registered: true, userInfo: action.payload };
    case USER_LOGIN_FAIL:
      return { loading: false, error: action.payload };
    case USER_LOGOUT:
      return { registered: false };
    default:
      return state;
  }
};

export const userRegisterReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_REGISTER_REQUEST:
      return { loading: true };
    case USER_REGISTER_SUCCESS:
      return { loading: false, userInfo: action.payload };
    case USER_REGISTER_FAIL:
      return { loading: false, error: action.payload };

    default:
      return state;
  }
};

export const userOtpVerificationReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_OTP_REQUEST:
      return { loading: true, verfied: false, phone: action.payload };

    case USER_OTP_SENT:
      return {
        loading: false,
        verified: false,
        id: action.payload,
        phone: action.phone,
      };

    case USER_OTP_VERIFICATION_SUCCESS:
      return { loading: false, verified: true, phone: action.payload };
    case USER_OTP_VERIFICATION_ERROR:
      return {
        loading: false,
        verified: false,
        message: action.payload,
        phone: action.phone,
        id: action.id,
      };
    case USER_OTP_VERIFICATION_FAIL:
      return {
        loading: false,
        verified: false,
        phone: action.data,
        error: action.payload,
      };
    default:
      return state;
  }
};

export const userDetailsReducer = (state = { user: {} }, action) => {
  switch (action.type) {
    case USER_DETAILS_REQUEST:
      return { ...state, loading: true };
    case USER_DETAILS_SUCCESS:
      return { loading: false, user: action.payload };
    case USER_DETAILS_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const userUpdateProfileReducer = (state = { user: {} }, action) => {
  switch (action.type) {
    case USER_UPDATE_PROFILE_REQUEST:
      return { ...state, loading: true };
    case USER_UPDATE_PROFILE_SUCCESS:
      return { loading: false, success: true, user: action.payload };
    case USER_UPDATE_PROFILE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

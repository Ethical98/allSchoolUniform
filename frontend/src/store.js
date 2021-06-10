import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import {
  productDetailsReducer,
  productListReducer,
} from './reducers/productReducers';
import { cartReducer } from './reducers/cartReducers';
import {
  userDetailsReducer,
  userLoginReducer,
  userOtpVerificationReducer,
  userRegisterReducer,
  userUpdateProfileReducer,
} from './reducers/userReducers';
import {
  orderCreateReducer,
  orderDetailsReducer,
  orderPayReducer,
} from './reducers/orderReducers';
import { decryptData } from './actions/Crypto';

const reducer = combineReducers({
  productList: productListReducer,
  productDetails: productDetailsReducer,
  cart: cartReducer,
  // cartReset: cartResetReducer,
  userLogin: userLoginReducer,
  userRegister: userRegisterReducer,
  userOtpVerification: userOtpVerificationReducer,
  userDetails: userDetailsReducer,
  userUpdateProfile: userUpdateProfileReducer,
  orderCreate: orderCreateReducer,
  orderDetails: orderDetailsReducer,
  orderPay: orderPayReducer,
});

const salt = process.env.REACT_APP_CRYPTO_SALT;

const cartItemsFromStorage = localStorage.getItem('cartItems')
  ? JSON.parse(decryptData(localStorage.getItem('cartItems'), salt))
  : [];

const userInfoFromStorage = localStorage.getItem('userInfo')
  ? JSON.parse(decryptData(localStorage.getItem('userInfo'), salt))
  : null;

const shippingAddressFromStorage = localStorage.getItem('shippingAddress')
  ? JSON.parse(decryptData(localStorage.getItem('shippingAddress'), salt))
  : {};

const cartSuccessFromStorage = localStorage.getItem('cartSuccess')
  ? JSON.parse(localStorage.getItem('cartSuccess'))
  : false;

const initialState = {
  cart: {
    cartItems: cartItemsFromStorage,
    shippingAddress: shippingAddressFromStorage,
    cartSuccess: cartSuccessFromStorage,
  },
  userLogin: { userInfo: userInfoFromStorage },
};

const middleware = [thunk];

const store = createStore(
  reducer,
  initialState,
  composeWithDevTools(applyMiddleware(...middleware))
);

export default store;

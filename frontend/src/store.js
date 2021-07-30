import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import {
  productCreateReducer,
  productDeleteReducer,
  productDetailsReducer,
  productListReducer,
  productUpdateReducer,
} from './reducers/productReducers';
import { cartReducer } from './reducers/cartReducers';
import {
  userDeleteReducer,
  userDetailsReducer,
  userListReducer,
  userLoginReducer,
  userOtpVerificationReducer,
  userPasswordResetReducer,
  userRegisterReducer,
  userUpdateProfileReducer,
  userUpdateReducer,
} from './reducers/userReducers';
import {
  orderCreateReducer,
  orderDetailsReducer,
  orderPayReducer,
  orderListMyReducer,
  orderListReducer,
  orderUpdateReducer,
} from './reducers/orderReducers';
import { decryptData } from './utils/Crypto';
import { typeListReducer, typeSizesListReducer } from './reducers/typeReducers';
import { classListReducer } from './reducers/classReducers';
import { schoolListReducer } from './reducers/schoolReducers';

const reducer = combineReducers({
  productList: productListReducer,
  productDetails: productDetailsReducer,
  productDelete: productDeleteReducer,
  productCreate: productCreateReducer,
  productUpdate: productUpdateReducer,
  typeSizesList: typeSizesListReducer,
  typeList: typeListReducer,
  classList: classListReducer,
  schoolList: schoolListReducer,
  cart: cartReducer,
  // cartReset: cartResetReducer,
  userLogin: userLoginReducer,
  userRegister: userRegisterReducer,
  userOtpVerification: userOtpVerificationReducer,
  userDetails: userDetailsReducer,
  userUpdateProfile: userUpdateProfileReducer,
  userPasswordReset: userPasswordResetReducer,
  userList: userListReducer,
  userDelete: userDeleteReducer,
  userUpdate: userUpdateReducer,
  orderCreate: orderCreateReducer,
  orderDetails: orderDetailsReducer,
  orderPay: orderPayReducer,
  orderListMy: orderListMyReducer,
  orderList: orderListReducer,
  orderUpdate: orderUpdateReducer,
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

const resetEmailFromStorage = localStorage.getItem('RE')
  ? JSON.parse(decryptData(localStorage.getItem('RE'), salt))
  : '';

const initialState = {
  cart: {
    cartItems: cartItemsFromStorage,
    shippingAddress: shippingAddressFromStorage,
    cartSuccess: cartSuccessFromStorage,
  },
  userLogin: { userInfo: userInfoFromStorage },
  userPasswordReset: { email: resetEmailFromStorage },
};

const middleware = [thunk];

const store = createStore(
  reducer,
  initialState,
  composeWithDevTools(applyMiddleware(...middleware))
);

export default store;

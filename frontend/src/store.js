import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import {
    productCreateReducer,
    productCreateReviewReducer,
    productDeleteReducer,
    productDetailsReducer,
    productImageListReducer,
    productImageUploadReducer,
    productListReducer,
    productUpdateReducer
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
    userUpdateReducer
} from './reducers/userReducers';
import {
    orderCreateReducer,
    orderDetailsReducer,
    orderPayReducer,
    orderListMyReducer,
    orderListReducer,
    orderUpdateReducer,
    orderDeliverReducer,
    orderOutForDeliveryReducer,
    orderProcessingReducer,
    orderConfirmReducer,
    orderUpdateBillTypeReducer,
    orderUpdateInvoiceNumberReducer,
    orderCancelReducer
} from './reducers/orderReducers';
import { decryptData } from './utils/Crypto';
import {
    typeCreateReducer,
    typeDeleteReducer,
    typeDetailsReducer,
    typeImageListReducer,
    typeImagesReducer,
    typeImageUploadReducer,
    typeListAllReducer,
    typeListReducer,
    typeSizesListReducer,
    typeUpdateReducer
} from './reducers/typeReducers';
import { classCreateReducer, classDeleteReducer, classListReducer, classUpdateReducer } from './reducers/classReducers';
import {
    schoolCreateReducer,
    schoolDeleteReducer,
    schoolDetailsReducer,
    schoolImageListReducer,
    schoolImageUploadReducer,
    schoolListReducer,
    schoolNameListReducer,
    schoolUpdateReducer
} from './reducers/schoolReducers';
import {
    announcementAddReducer,
    announcementDeleteReducer,
    announcementListReducer,
    announcementUpdateReducer,
    carouselImageAddReducer,
    carouselImageDeleteReducer,
    carouselImageListReducer,
    carouselImageUpdateReducer,
    headerBackgroundDetailsReducer,
    headerBackgroundUpdateReducer,
    statisticsDetailsReducer,
    statisticsUpdateReducer
} from './reducers/homeReducer';

const reducer = combineReducers({
    productList: productListReducer,
    productDetails: productDetailsReducer,
    productDelete: productDeleteReducer,
    productCreate: productCreateReducer,
    productUpdate: productUpdateReducer,
    productCreateReview: productCreateReviewReducer,
    productImageList: productImageListReducer,
    productImageUpload: productImageUploadReducer,
    typeSizesList: typeSizesListReducer,
    typeList: typeListReducer,
    typeListAll: typeListAllReducer,
    typeImages: typeImagesReducer,
    typeCreate: typeCreateReducer,
    typeUpdate: typeUpdateReducer,
    typeDelete: typeDeleteReducer,
    typeDetails: typeDetailsReducer,
    typeImageList: typeImageListReducer,
    typeImageUpload: typeImageUploadReducer,
    classList: classListReducer,
    classCreate: classCreateReducer,
    classDelete: classDeleteReducer,
    classUpdate: classUpdateReducer,
    schoolList: schoolListReducer,
    schoolNameList: schoolNameListReducer,
    schoolCreate: schoolCreateReducer,
    schoolUpdate: schoolUpdateReducer,
    schoolDelete: schoolDeleteReducer,
    schoolDetails: schoolDetailsReducer,
    schoolImageList: schoolImageListReducer,
    schoolImageUpload: schoolImageUploadReducer,

    cart: cartReducer,
    // CartReset: cartResetReducer,
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
    orderDeliver: orderDeliverReducer,
    orderCancel:orderCancelReducer,
    orderOutForDelivery: orderOutForDeliveryReducer,
    orderProcessing: orderProcessingReducer,
    orderConfirm: orderConfirmReducer,
    orderUpdateBillType: orderUpdateBillTypeReducer,
    orderUpdateInvoiceNumber: orderUpdateInvoiceNumberReducer,
    carouselImageList: carouselImageListReducer,
    carouselImageUpdate: carouselImageUpdateReducer,
    carouselImageDelete: carouselImageDeleteReducer,
    carouselImageAdd: carouselImageAddReducer,
    statisticsDetails: statisticsDetailsReducer,
    statisticsUpdate: statisticsUpdateReducer,
    headerBackgroundDetails: headerBackgroundDetailsReducer,
    headerBackgroundUpdate: headerBackgroundUpdateReducer,
    announcementList: announcementListReducer,
    announcementUpdate: announcementUpdateReducer,
    announcementDelete: announcementDeleteReducer,
    announcementAdd: announcementAddReducer
});

const salt = process.env.REACT_APP_CRYPTO_SALT;

const cartItemsFromStorage = localStorage.getItem('cartItems')
    ? decryptData(localStorage.getItem('cartItems'), salt)
    : [];

const userInfoFromStorage = localStorage.getItem('userInfo')
    ? decryptData(localStorage.getItem('userInfo'), salt)
    : null;

const shippingAddressFromStorage = localStorage.getItem('shippingAddress')
    ? decryptData(localStorage.getItem('shippingAddress'), salt)
    : {};

const cartSuccessFromStorage = localStorage.getItem('cartSuccess')
    ? JSON.parse(localStorage.getItem('cartSuccess'))
    : false;

const resetEmailFromStorage = localStorage.getItem('RE') ? decryptData(localStorage.getItem('RE'), salt) : '';

const initialState = {
    cart: {
        cartItems: cartItemsFromStorage,
        shippingAddress: shippingAddressFromStorage,
        cartSuccess: cartSuccessFromStorage
    },
    userLogin: { userInfo: userInfoFromStorage },
    userPasswordReset: { email: resetEmailFromStorage }
};

const middleware = [thunk];

const store = createStore(reducer, initialState, composeWithDevTools(applyMiddleware(...middleware)));

export default store;

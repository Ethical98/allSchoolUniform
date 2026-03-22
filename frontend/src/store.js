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
    productUpdateReducer,
    productDisplayOrdersReducer,
    productUpdateFeaturedReducer
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
    orderCancelReducer,
    orderAddCommentReducer,
    orderDeleteCommentReducer
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
    quotationListReducer,
    quotationDetailsReducer,
    quotationCreateReducer,
    quotationUpdateReducer,
    quotationDeleteReducer,
    quotationStatusReducer,
    quotationConvertReducer,
    quotationCloneReducer,
    productPickerReducer,
    cashBillCreateReducer,
    templateListReducer,
    templateCreateReducer,
    templateUpdateReducer,
    templateDeleteReducer,
    recordPaymentReducer,
    creditNoteCreateReducer,
    debitNoteCreateReducer,
    billingReportReducer,
    billingConfigReducer,
    billingConfigUpdateReducer,
} from './reducers/billingReducers';
import {
    companyListReducer,
    companyDetailsReducer,
    companyCreateReducer,
    companyUpdateReducer,
    companyDeleteReducer,
    companySearchReducer
} from './reducers/companyReducers';
import {
    stockDashboardReducer,
    stockOverviewReducer,
    stockProductDetailsReducer,
    stockAdjustReducer,
    stockBulkAdjustReducer,
    stockMovementsReducer,
    stockAlertsReducer,
    stockAlertAcknowledgeReducer,
    stockValuationReducer,
    stockValuationFiltersReducer,
    stockVelocityReducer
} from './reducers/stockReducers';
import { adminDashboardReducer } from './reducers/dashboardReducers';
import {
    shippingDashboardReducer,
    shippingServiceabilityReducer,
    shippingCreateOrderReducer,
    shippingAssignCourierReducer,
    shippingSchedulePickupReducer,
    shippingGenerateLabelReducer,
    shippingGenerateManifestReducer,
    shippingTrackOrderReducer,
    shippingNdrListReducer,
    shippingNdrReattemptReducer,
    shippingNdrRtoReducer,
    shippingCancelReducer,
} from './reducers/shippingReducers';
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
    productDisplayOrders: productDisplayOrdersReducer,
    productUpdateFeatured: productUpdateFeaturedReducer,
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
    orderAddComment: orderAddCommentReducer,
    orderDeleteComment: orderDeleteCommentReducer,
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
    announcementAdd: announcementAddReducer,
    stockDashboard: stockDashboardReducer,
    stockOverview: stockOverviewReducer,
    stockProductDetails: stockProductDetailsReducer,
    stockAdjust: stockAdjustReducer,
    stockBulkAdjust: stockBulkAdjustReducer,
    stockMovements: stockMovementsReducer,
    stockAlerts: stockAlertsReducer,
    stockAlertAcknowledge: stockAlertAcknowledgeReducer,
    stockValuation: stockValuationReducer,
    stockValuationFilters: stockValuationFiltersReducer,
    stockVelocity: stockVelocityReducer,
    quotationList: quotationListReducer,
    quotationDetails: quotationDetailsReducer,
    quotationCreate: quotationCreateReducer,
    quotationUpdate: quotationUpdateReducer,
    quotationDelete: quotationDeleteReducer,
    quotationStatus: quotationStatusReducer,
    quotationConvert: quotationConvertReducer,
    quotationClone: quotationCloneReducer,
    productPicker: productPickerReducer,
    cashBillCreate: cashBillCreateReducer,
    templateList: templateListReducer,
    templateCreate: templateCreateReducer,
    templateUpdate: templateUpdateReducer,
    templateDelete: templateDeleteReducer,
    recordPayment: recordPaymentReducer,
    creditNoteCreate: creditNoteCreateReducer,
    debitNoteCreate: debitNoteCreateReducer,
    companyList: companyListReducer,
    companyDetails: companyDetailsReducer,
    companyCreate: companyCreateReducer,
    companyUpdate: companyUpdateReducer,
    companyDelete: companyDeleteReducer,
    companySearch: companySearchReducer,
    billingReport: billingReportReducer,
    billingConfig: billingConfigReducer,
    billingConfigUpdate: billingConfigUpdateReducer,
    adminDashboard: adminDashboardReducer,
    shippingDashboard: shippingDashboardReducer,
    shippingServiceability: shippingServiceabilityReducer,
    shippingCreateOrder: shippingCreateOrderReducer,
    shippingAssignCourier: shippingAssignCourierReducer,
    shippingSchedulePickup: shippingSchedulePickupReducer,
    shippingGenerateLabel: shippingGenerateLabelReducer,
    shippingGenerateManifest: shippingGenerateManifestReducer,
    shippingTrackOrder: shippingTrackOrderReducer,
    shippingNdrList: shippingNdrListReducer,
    shippingNdrReattempt: shippingNdrReattemptReducer,
    shippingNdrRto: shippingNdrRtoReducer,
    shippingCancel: shippingCancelReducer,
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

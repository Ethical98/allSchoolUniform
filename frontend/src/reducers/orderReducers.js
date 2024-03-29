import {
    ORDER_CREATE_FAIL,
    ORDER_CREATE_REQUEST,
    ORDER_CREATE_SUCCESS,
    ORDER_DETAILS_REQUEST,
    ORDER_DETAILS_SUCCESS,
    ORDER_DETAILS_FAIL,
    ORDER_PAY_REQUEST,
    ORDER_PAY_SUCCESS,
    ORDER_PAY_FAIL,
    ORDER_PAY_RESET,
    ORDER_CREATE_RESET,
    ORDER_LIST_MY_REQUEST,
    ORDER_LIST_MY_SUCCESS,
    ORDER_LIST_MY_FAIL,
    ORDER_LIST_MY_RESET,
    ORDER_LIST_REQUEST,
    ORDER_LIST_SUCCESS,
    ORDER_LIST_FAIL,
    ORDER_UPDATE_REQUEST,
    ORDER_UPDATE_SUCCESS,
    ORDER_UPDATE_FAIL,
    ORDER_UPDATE_RESET,
    ORDER_DELIVER_REQUEST,
    ORDER_DELIVER_SUCCESS,
    ORDER_DELIVER_FAIL,
    ORDER_DELIVER_RESET,
    ORDER_CONFIRM_RESET,
    ORDER_CONFIRM_FAIL,
    ORDER_CONFIRM_SUCCESS,
    ORDER_CONFIRM_REQUEST,
    ORDER_OUT_FOR_DELIVERY_RESET,
    ORDER_OUT_FOR_DELIVERY_FAIL,
    ORDER_OUT_FOR_DELIVERY_SUCCESS,
    ORDER_OUT_FOR_DELIVERY_REQUEST,
    ORDER_PROCESSING_RESET,
    ORDER_PROCESSING_FAIL,
    ORDER_PROCESSING_SUCCESS,
    ORDER_PROCESSING_REQUEST,
    ORDER_DETAILS_RESET,
    ORDER_UPDATE_BILLTYPE_SUCCESS,
    ORDER_UPDATE_BILLTYPE_REQUEST,
    ORDER_UPDATE_BILLTYPE_FAIL,
    ORDER_UPDATE_BILLTYPE_RESET,
    ORDER_UPDATE_INVOICE_NUMBER_REQUEST,
    ORDER_UPDATE_INVOICE_NUMBER_SUCCESS,
    ORDER_UPDATE_INVOICE_NUMBER_FAIL,
    ORDER_UPDATE_INVOICE_NUMBER_RESET,
    ORDER_CANCEL_REQUEST,
    ORDER_CANCEL_SUCCESS,
    ORDER_CANCEL_FAIL,
    ORDER_CANCEL_RESET
} from '../constants/orderConstants';

export const orderCreateReducer = (state = {}, action) => {
    switch (action.type) {
        case ORDER_CREATE_REQUEST:
            return { loading: true };
        case ORDER_CREATE_SUCCESS:
            return { loading: false, success: true, order: action.payload };
        case ORDER_CREATE_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_CREATE_RESET:
            return {};
        default:
            return state;
    }
};

export const orderDetailsReducer = (state = { loading: true, orderItems: [], shippingAddress: {} }, action) => {
    switch (action.type) {
        case ORDER_DETAILS_REQUEST:
            return { ...state, loading: true };
        case ORDER_DETAILS_SUCCESS:
            return { loading: false, order: action.payload };
        case ORDER_DETAILS_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_DETAILS_RESET:
            return {
                order: { user: {}, tracking: {}, orderItems: [], shippingAddress: {} }
            };

        default:
            return state;
    }
};

export const orderPayReducer = (state = { response: { order: {} } }, action) => {
    switch (action.type) {
        case ORDER_PAY_REQUEST:
            return { ...state, loading: true, pd: action.payload };
        case ORDER_PAY_SUCCESS:
            return {
                ...state,
                paymentDetails: action.payload,
                loading: false,
                success: true
            };
        case ORDER_PAY_FAIL:
            return { ...state, loading: false, error: action.payload, success: false };
        case ORDER_PAY_RESET:
            return {};
        default:
            return state;
    }
};

export const orderListMyReducer = (state = { orders: [] }, action) => {
    switch (action.type) {
        case ORDER_LIST_MY_REQUEST:
            return { loading: true };
        case ORDER_LIST_MY_SUCCESS:
            return {
                loading: false,
                orders: action.payload
            };
        case ORDER_LIST_MY_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_LIST_MY_RESET: {
            return { orders: [] };
        }
        default:
            return state;
    }
};

export const orderListReducer = (state = { orders: [] }, action) => {
    switch (action.type) {
        case ORDER_LIST_REQUEST:
            return { loading: true };
        case ORDER_LIST_SUCCESS:
            return {
                loading: false,
                orders: action.payload.orders,
                pages: action.payload.pages,
                page: action.payload.page
            };
        case ORDER_LIST_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const orderUpdateReducer = (state = { updatedOrder: {} }, action) => {
    switch (action.type) {
        case ORDER_UPDATE_REQUEST:
            return { loading: true };
        case ORDER_UPDATE_SUCCESS:
            return { loading: false, success: true, updatedOrder: action.payload };
        case ORDER_UPDATE_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_UPDATE_RESET:
            return { updatedOrder: {} };
        default:
            return state;
    }
};

export const orderProcessingReducer = (state = {}, action) => {
    switch (action.type) {
        case ORDER_PROCESSING_REQUEST:
            return { loading: true };
        case ORDER_PROCESSING_SUCCESS:
            return { loading: false, success: true };
        case ORDER_PROCESSING_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_PROCESSING_RESET:
            return {};
        default:
            return state;
    }
};

export const orderOutForDeliveryReducer = (state = {}, action) => {
    switch (action.type) {
        case ORDER_OUT_FOR_DELIVERY_REQUEST:
            return { loading: true };
        case ORDER_OUT_FOR_DELIVERY_SUCCESS:
            return { loading: false, success: true };
        case ORDER_OUT_FOR_DELIVERY_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_OUT_FOR_DELIVERY_RESET:
            return {};
        default:
            return state;
    }
};

export const orderConfirmReducer = (state = {}, action) => {
    switch (action.type) {
        case ORDER_CONFIRM_REQUEST:
            return { loading: true };
        case ORDER_CONFIRM_SUCCESS:
            return { loading: false, success: true };
        case ORDER_CONFIRM_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_CONFIRM_RESET:
            return {};
        default:
            return state;
    }
};

export const orderDeliverReducer = (state = {}, action) => {
    switch (action.type) {
        case ORDER_DELIVER_REQUEST:
            return { loading: true };
        case ORDER_DELIVER_SUCCESS:
            return { loading: false, success: true };
        case ORDER_DELIVER_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_DELIVER_RESET:
            return {};
        default:
            return state;
    }
};

export const orderCancelReducer = (state = {}, action) => {
    switch (action.type) {
        case ORDER_CANCEL_REQUEST:
            return { loading: true };
        case ORDER_CANCEL_SUCCESS:
            return { loading: false, success: true };
        case ORDER_CANCEL_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_CANCEL_RESET:
            return {};
        default:
            return state;
    }
};

export const orderUpdateBillTypeReducer = (state = {}, action) => {
    switch (action.type) {
        case ORDER_UPDATE_BILLTYPE_REQUEST:
            return { loading: true };
        case ORDER_UPDATE_BILLTYPE_SUCCESS:
            return { loading: false, success: true };
        case ORDER_UPDATE_BILLTYPE_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_UPDATE_BILLTYPE_RESET:
            return {};
        default:
            return state;
    }
};

export const orderUpdateInvoiceNumberReducer = (state = {}, action) => {
    switch (action.type) {
        case ORDER_UPDATE_INVOICE_NUMBER_REQUEST:
            return { loading: true };
        case ORDER_UPDATE_INVOICE_NUMBER_SUCCESS:
            return { loading: false, success: true, order: action.payload };
        case ORDER_UPDATE_INVOICE_NUMBER_FAIL:
            return { loading: false, error: action.payload };
        case ORDER_UPDATE_INVOICE_NUMBER_RESET:
            return {};
        default:
            return state;
    }
};

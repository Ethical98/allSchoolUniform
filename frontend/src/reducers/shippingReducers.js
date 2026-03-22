import {
    SHIPPING_DASHBOARD_REQUEST,
    SHIPPING_DASHBOARD_SUCCESS,
    SHIPPING_DASHBOARD_FAIL,
    SHIPPING_SERVICEABILITY_REQUEST,
    SHIPPING_SERVICEABILITY_SUCCESS,
    SHIPPING_SERVICEABILITY_FAIL,
    SHIPPING_SERVICEABILITY_RESET,
    SHIPPING_CREATE_ORDER_REQUEST,
    SHIPPING_CREATE_ORDER_SUCCESS,
    SHIPPING_CREATE_ORDER_FAIL,
    SHIPPING_CREATE_ORDER_RESET,
    SHIPPING_ASSIGN_COURIER_REQUEST,
    SHIPPING_ASSIGN_COURIER_SUCCESS,
    SHIPPING_ASSIGN_COURIER_FAIL,
    SHIPPING_ASSIGN_COURIER_RESET,
    SHIPPING_SCHEDULE_PICKUP_REQUEST,
    SHIPPING_SCHEDULE_PICKUP_SUCCESS,
    SHIPPING_SCHEDULE_PICKUP_FAIL,
    SHIPPING_SCHEDULE_PICKUP_RESET,
    SHIPPING_GENERATE_LABEL_REQUEST,
    SHIPPING_GENERATE_LABEL_SUCCESS,
    SHIPPING_GENERATE_LABEL_FAIL,
    SHIPPING_GENERATE_MANIFEST_REQUEST,
    SHIPPING_GENERATE_MANIFEST_SUCCESS,
    SHIPPING_GENERATE_MANIFEST_FAIL,
    SHIPPING_TRACK_ORDER_REQUEST,
    SHIPPING_TRACK_ORDER_SUCCESS,
    SHIPPING_TRACK_ORDER_FAIL,
    SHIPPING_NDR_LIST_REQUEST,
    SHIPPING_NDR_LIST_SUCCESS,
    SHIPPING_NDR_LIST_FAIL,
    SHIPPING_NDR_REATTEMPT_REQUEST,
    SHIPPING_NDR_REATTEMPT_SUCCESS,
    SHIPPING_NDR_REATTEMPT_FAIL,
    SHIPPING_NDR_REATTEMPT_RESET,
    SHIPPING_NDR_RTO_REQUEST,
    SHIPPING_NDR_RTO_SUCCESS,
    SHIPPING_NDR_RTO_FAIL,
    SHIPPING_NDR_RTO_RESET,
    SHIPPING_CANCEL_REQUEST,
    SHIPPING_CANCEL_SUCCESS,
    SHIPPING_CANCEL_FAIL,
    SHIPPING_CANCEL_RESET,
} from '../constants/shippingConstants';

export const shippingDashboardReducer = (state = { dashboard: {} }, action) => {
    switch (action.type) {
        case SHIPPING_DASHBOARD_REQUEST:
            return { ...state, loading: true };
        case SHIPPING_DASHBOARD_SUCCESS:
            return { loading: false, dashboard: action.payload };
        case SHIPPING_DASHBOARD_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const shippingServiceabilityReducer = (state = {}, action) => {
    switch (action.type) {
        case SHIPPING_SERVICEABILITY_REQUEST:
            return { loading: true };
        case SHIPPING_SERVICEABILITY_SUCCESS:
            return { loading: false, couriers: action.payload };
        case SHIPPING_SERVICEABILITY_FAIL:
            return { loading: false, error: action.payload };
        case SHIPPING_SERVICEABILITY_RESET:
            return {};
        default:
            return state;
    }
};

export const shippingCreateOrderReducer = (state = {}, action) => {
    switch (action.type) {
        case SHIPPING_CREATE_ORDER_REQUEST:
            return { loading: true };
        case SHIPPING_CREATE_ORDER_SUCCESS:
            return { loading: false, success: true, data: action.payload };
        case SHIPPING_CREATE_ORDER_FAIL:
            return { loading: false, error: action.payload };
        case SHIPPING_CREATE_ORDER_RESET:
            return {};
        default:
            return state;
    }
};

export const shippingAssignCourierReducer = (state = {}, action) => {
    switch (action.type) {
        case SHIPPING_ASSIGN_COURIER_REQUEST:
            return { loading: true };
        case SHIPPING_ASSIGN_COURIER_SUCCESS:
            return { loading: false, success: true, data: action.payload };
        case SHIPPING_ASSIGN_COURIER_FAIL:
            return { loading: false, error: action.payload };
        case SHIPPING_ASSIGN_COURIER_RESET:
            return {};
        default:
            return state;
    }
};

export const shippingSchedulePickupReducer = (state = {}, action) => {
    switch (action.type) {
        case SHIPPING_SCHEDULE_PICKUP_REQUEST:
            return { loading: true };
        case SHIPPING_SCHEDULE_PICKUP_SUCCESS:
            return { loading: false, success: true, data: action.payload };
        case SHIPPING_SCHEDULE_PICKUP_FAIL:
            return { loading: false, error: action.payload };
        case SHIPPING_SCHEDULE_PICKUP_RESET:
            return {};
        default:
            return state;
    }
};

export const shippingGenerateLabelReducer = (state = {}, action) => {
    switch (action.type) {
        case SHIPPING_GENERATE_LABEL_REQUEST:
            return { loading: true };
        case SHIPPING_GENERATE_LABEL_SUCCESS:
            return { loading: false, success: true, data: action.payload };
        case SHIPPING_GENERATE_LABEL_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const shippingGenerateManifestReducer = (state = {}, action) => {
    switch (action.type) {
        case SHIPPING_GENERATE_MANIFEST_REQUEST:
            return { loading: true };
        case SHIPPING_GENERATE_MANIFEST_SUCCESS:
            return { loading: false, success: true, data: action.payload };
        case SHIPPING_GENERATE_MANIFEST_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const shippingTrackOrderReducer = (state = {}, action) => {
    switch (action.type) {
        case SHIPPING_TRACK_ORDER_REQUEST:
            return { loading: true };
        case SHIPPING_TRACK_ORDER_SUCCESS:
            return { loading: false, tracking: action.payload };
        case SHIPPING_TRACK_ORDER_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const shippingNdrListReducer = (state = { orders: [] }, action) => {
    switch (action.type) {
        case SHIPPING_NDR_LIST_REQUEST:
            return { ...state, loading: true };
        case SHIPPING_NDR_LIST_SUCCESS:
            return { loading: false, ...action.payload };
        case SHIPPING_NDR_LIST_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const shippingNdrReattemptReducer = (state = {}, action) => {
    switch (action.type) {
        case SHIPPING_NDR_REATTEMPT_REQUEST:
            return { loading: true };
        case SHIPPING_NDR_REATTEMPT_SUCCESS:
            return { loading: false, success: true };
        case SHIPPING_NDR_REATTEMPT_FAIL:
            return { loading: false, error: action.payload };
        case SHIPPING_NDR_REATTEMPT_RESET:
            return {};
        default:
            return state;
    }
};

export const shippingNdrRtoReducer = (state = {}, action) => {
    switch (action.type) {
        case SHIPPING_NDR_RTO_REQUEST:
            return { loading: true };
        case SHIPPING_NDR_RTO_SUCCESS:
            return { loading: false, success: true };
        case SHIPPING_NDR_RTO_FAIL:
            return { loading: false, error: action.payload };
        case SHIPPING_NDR_RTO_RESET:
            return {};
        default:
            return state;
    }
};

export const shippingCancelReducer = (state = {}, action) => {
    switch (action.type) {
        case SHIPPING_CANCEL_REQUEST:
            return { loading: true };
        case SHIPPING_CANCEL_SUCCESS:
            return { loading: false, success: true, data: action.payload };
        case SHIPPING_CANCEL_FAIL:
            return { loading: false, error: action.payload };
        case SHIPPING_CANCEL_RESET:
            return {};
        default:
            return state;
    }
};

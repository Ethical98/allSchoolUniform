import {
    STOCK_DASHBOARD_REQUEST,
    STOCK_DASHBOARD_SUCCESS,
    STOCK_DASHBOARD_FAIL,
    STOCK_OVERVIEW_REQUEST,
    STOCK_OVERVIEW_SUCCESS,
    STOCK_OVERVIEW_FAIL,
    STOCK_PRODUCT_DETAILS_REQUEST,
    STOCK_PRODUCT_DETAILS_SUCCESS,
    STOCK_PRODUCT_DETAILS_FAIL,
    STOCK_PRODUCT_DETAILS_RESET,
    STOCK_ADJUST_REQUEST,
    STOCK_ADJUST_SUCCESS,
    STOCK_ADJUST_FAIL,
    STOCK_ADJUST_RESET,
    STOCK_BULK_ADJUST_REQUEST,
    STOCK_BULK_ADJUST_SUCCESS,
    STOCK_BULK_ADJUST_FAIL,
    STOCK_BULK_ADJUST_RESET,
    STOCK_MOVEMENTS_REQUEST,
    STOCK_MOVEMENTS_SUCCESS,
    STOCK_MOVEMENTS_FAIL,
    STOCK_ALERTS_REQUEST,
    STOCK_ALERTS_SUCCESS,
    STOCK_ALERTS_FAIL,
    STOCK_ALERT_ACKNOWLEDGE_REQUEST,
    STOCK_ALERT_ACKNOWLEDGE_SUCCESS,
    STOCK_ALERT_ACKNOWLEDGE_FAIL,
    STOCK_ALERT_ACKNOWLEDGE_RESET,
    STOCK_VALUATION_REQUEST,
    STOCK_VALUATION_SUCCESS,
    STOCK_VALUATION_FAIL,
    STOCK_VALUATION_FILTERS_REQUEST,
    STOCK_VALUATION_FILTERS_SUCCESS,
    STOCK_VALUATION_FILTERS_FAIL,
    STOCK_VELOCITY_REQUEST,
    STOCK_VELOCITY_SUCCESS,
    STOCK_VELOCITY_FAIL
} from '../constants/stockConstants';

export const stockDashboardReducer = (state = { dashboard: {} }, action) => {
    switch (action.type) {
        case STOCK_DASHBOARD_REQUEST:
            return { ...state, loading: true };
        case STOCK_DASHBOARD_SUCCESS:
            return { loading: false, dashboard: action.payload };
        case STOCK_DASHBOARD_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const stockOverviewReducer = (state = { products: [], page: 1, pages: 1 }, action) => {
    switch (action.type) {
        case STOCK_OVERVIEW_REQUEST:
            return { ...state, loading: true, error: null };
        case STOCK_OVERVIEW_SUCCESS:
            return {
                loading: false,
                products: action.payload.products,
                page: action.payload.page,
                pages: action.payload.pages
            };
        case STOCK_OVERVIEW_FAIL:
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export const stockProductDetailsReducer = (state = { product: {}, movements: [], alerts: [] }, action) => {
    switch (action.type) {
        case STOCK_PRODUCT_DETAILS_REQUEST:
            return { ...state, loading: true, error: null };
        case STOCK_PRODUCT_DETAILS_SUCCESS:
            return {
                loading: false,
                product: action.payload.product,
                movements: action.payload.movements,
                alerts: action.payload.alerts
            };
        case STOCK_PRODUCT_DETAILS_FAIL:
            return { ...state, loading: false, error: action.payload };
        case STOCK_PRODUCT_DETAILS_RESET:
            return { product: {}, movements: [], alerts: [] };
        default:
            return state;
    }
};

export const stockAdjustReducer = (state = {}, action) => {
    switch (action.type) {
        case STOCK_ADJUST_REQUEST:
            return { loading: true };
        case STOCK_ADJUST_SUCCESS:
            return { loading: false, success: true, movement: action.payload };
        case STOCK_ADJUST_FAIL:
            return { loading: false, error: action.payload };
        case STOCK_ADJUST_RESET:
            return {};
        default:
            return state;
    }
};

export const stockBulkAdjustReducer = (state = {}, action) => {
    switch (action.type) {
        case STOCK_BULK_ADJUST_REQUEST:
            return { loading: true };
        case STOCK_BULK_ADJUST_SUCCESS:
            return { loading: false, success: true, results: action.payload };
        case STOCK_BULK_ADJUST_FAIL:
            return { loading: false, error: action.payload };
        case STOCK_BULK_ADJUST_RESET:
            return {};
        default:
            return state;
    }
};

export const stockMovementsReducer = (state = { movements: [] }, action) => {
    switch (action.type) {
        case STOCK_MOVEMENTS_REQUEST:
            return { ...state, loading: true, error: null };
        case STOCK_MOVEMENTS_SUCCESS:
            return {
                loading: false,
                movements: action.payload.movements,
                page: action.payload.page,
                pages: action.payload.pages
            };
        case STOCK_MOVEMENTS_FAIL:
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export const stockAlertsReducer = (state = { alerts: [] }, action) => {
    switch (action.type) {
        case STOCK_ALERTS_REQUEST:
            return { ...state, loading: true };
        case STOCK_ALERTS_SUCCESS:
            return { loading: false, alerts: action.payload };
        case STOCK_ALERTS_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const stockAlertAcknowledgeReducer = (state = {}, action) => {
    switch (action.type) {
        case STOCK_ALERT_ACKNOWLEDGE_REQUEST:
            return { loading: true };
        case STOCK_ALERT_ACKNOWLEDGE_SUCCESS:
            return { loading: false, success: true };
        case STOCK_ALERT_ACKNOWLEDGE_FAIL:
            return { loading: false, error: action.payload };
        case STOCK_ALERT_ACKNOWLEDGE_RESET:
            return {};
        default:
            return state;
    }
};

export const stockValuationReducer = (state = { valuation: {} }, action) => {
    switch (action.type) {
        case STOCK_VALUATION_REQUEST:
            return { ...state, loading: true };
        case STOCK_VALUATION_SUCCESS:
            return { loading: false, valuation: action.payload };
        case STOCK_VALUATION_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const stockValuationFiltersReducer = (state = { schools: [], types: [] }, action) => {
    switch (action.type) {
        case STOCK_VALUATION_FILTERS_REQUEST:
            return { ...state, loading: true };
        case STOCK_VALUATION_FILTERS_SUCCESS:
            return { loading: false, schools: action.payload.schools, types: action.payload.types };
        case STOCK_VALUATION_FILTERS_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const stockVelocityReducer = (state = { velocity: [] }, action) => {
    switch (action.type) {
        case STOCK_VELOCITY_REQUEST:
            return { ...state, loading: true };
        case STOCK_VELOCITY_SUCCESS:
            return { loading: false, velocity: action.payload };
        case STOCK_VELOCITY_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

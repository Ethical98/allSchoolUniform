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
    STOCK_ADJUST_REQUEST,
    STOCK_ADJUST_SUCCESS,
    STOCK_ADJUST_FAIL,
    STOCK_BULK_ADJUST_REQUEST,
    STOCK_BULK_ADJUST_SUCCESS,
    STOCK_BULK_ADJUST_FAIL,
    STOCK_MOVEMENTS_REQUEST,
    STOCK_MOVEMENTS_SUCCESS,
    STOCK_MOVEMENTS_FAIL,
    STOCK_ALERTS_REQUEST,
    STOCK_ALERTS_SUCCESS,
    STOCK_ALERTS_FAIL,
    STOCK_ALERT_ACKNOWLEDGE_REQUEST,
    STOCK_ALERT_ACKNOWLEDGE_SUCCESS,
    STOCK_ALERT_ACKNOWLEDGE_FAIL,
    STOCK_VALUATION_REQUEST,
    STOCK_VALUATION_SUCCESS,
    STOCK_VALUATION_FAIL,
    STOCK_VALUATION_FILTERS_REQUEST,
    STOCK_VALUATION_FILTERS_SUCCESS,
    STOCK_VALUATION_FILTERS_FAIL,
    STOCK_VELOCITY_REQUEST,
    STOCK_VELOCITY_SUCCESS,
    STOCK_VELOCITY_FAIL,
    STOCK_PRODUCT_DETAILS_RESET,
    STOCK_ADJUST_RESET,
    STOCK_BULK_ADJUST_RESET,
    STOCK_ALERT_ACKNOWLEDGE_RESET,
} from '../constants/stockConstants';
import api, { getAuthConfig } from '../utils/api';

export const getStockDashboard = (season = '') => async (dispatch, getState) => {
    try {
        dispatch({ type: STOCK_DASHBOARD_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.get(`/api/stock/dashboard?season=${season}`, config);

        dispatch({
            type: STOCK_DASHBOARD_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: STOCK_DASHBOARD_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const getStockOverview =
    (page = '', school = '', type = '', search = '', stockStatus = '', size = '', season = '') =>
    async (dispatch, getState) => {
        try {
            dispatch({ type: STOCK_OVERVIEW_REQUEST });

            const config = getAuthConfig(getState);

            const { data } = await api.get(
                `/api/stock/overview?page=${page}&school=${school}&type=${type}&search=${search}&stockStatus=${stockStatus}&size=${size}&season=${season}`,
                config
            );

            dispatch({
                type: STOCK_OVERVIEW_SUCCESS,
                payload: data
            });
        } catch (error) {
            dispatch({
                type: STOCK_OVERVIEW_FAIL,
                payload: error.response && error.response.data.message ? error.response.data.message : error.message
            });
        }
    };

export const getProductStock = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: STOCK_PRODUCT_DETAILS_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.get(`/api/stock/product/${id}`, config);

        dispatch({
            type: STOCK_PRODUCT_DETAILS_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: STOCK_PRODUCT_DETAILS_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const adjustStock = (adjustmentData) => async (dispatch, getState) => {
    try {
        dispatch({ type: STOCK_ADJUST_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.post('/api/stock/adjust', adjustmentData, config);

        dispatch({
            type: STOCK_ADJUST_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: STOCK_ADJUST_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const bulkAdjustStock = (adjustments) => async (dispatch, getState) => {
    try {
        dispatch({ type: STOCK_BULK_ADJUST_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.post('/api/stock/bulk-adjust', adjustments, config);

        dispatch({
            type: STOCK_BULK_ADJUST_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: STOCK_BULK_ADJUST_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const getStockMovements =
    (page = '', search = '', type = '', startDate = '', endDate = '') =>
    async (dispatch, getState) => {
        try {
            dispatch({ type: STOCK_MOVEMENTS_REQUEST });

            const config = getAuthConfig(getState);

            const { data } = await api.get(
                `/api/stock/movements?page=${page}&search=${search}&type=${type}&startDate=${startDate}&endDate=${endDate}`,
                config
            );

            dispatch({
                type: STOCK_MOVEMENTS_SUCCESS,
                payload: data
            });
        } catch (error) {
            dispatch({
                type: STOCK_MOVEMENTS_FAIL,
                payload: error.response && error.response.data.message ? error.response.data.message : error.message
            });
        }
    };

export const getProductMovements = (productId) => async (dispatch, getState) => {
    try {
        dispatch({ type: STOCK_MOVEMENTS_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.get(`/api/stock/movements/${productId}`, config);

        dispatch({
            type: STOCK_MOVEMENTS_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: STOCK_MOVEMENTS_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const getStockAlerts =
    (status = 'ACTIVE') =>
    async (dispatch, getState) => {
        try {
            dispatch({ type: STOCK_ALERTS_REQUEST });

            const config = getAuthConfig(getState);

            const { data } = await api.get(`/api/stock/alerts?status=${status}`, config);

            dispatch({
                type: STOCK_ALERTS_SUCCESS,
                payload: data
            });
        } catch (error) {
            dispatch({
                type: STOCK_ALERTS_FAIL,
                payload: error.response && error.response.data.message ? error.response.data.message : error.message
            });
        }
    };

export const acknowledgeStockAlert = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: STOCK_ALERT_ACKNOWLEDGE_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.patch(`/api/stock/alerts/${id}/acknowledge`, {}, config);

        dispatch({
            type: STOCK_ALERT_ACKNOWLEDGE_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: STOCK_ALERT_ACKNOWLEDGE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const getStockValuation =
    (school = '', type = '') =>
    async (dispatch, getState) => {
        try {
            dispatch({ type: STOCK_VALUATION_REQUEST });

            const config = getAuthConfig(getState);

            const { data } = await api.get(
                `/api/stock/valuation?school=${school}&type=${type}`,
                config
            );

            dispatch({
                type: STOCK_VALUATION_SUCCESS,
                payload: data
            });
        } catch (error) {
            dispatch({
                type: STOCK_VALUATION_FAIL,
                payload: error.response && error.response.data.message ? error.response.data.message : error.message
            });
        }
    };

export const getStockValuationFilters = () => async (dispatch, getState) => {
    try {
        dispatch({ type: STOCK_VALUATION_FILTERS_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.get('/api/stock/valuation/filters', config);

        dispatch({
            type: STOCK_VALUATION_FILTERS_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: STOCK_VALUATION_FILTERS_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const getSalesVelocity =
    (days = 30) =>
    async (dispatch, getState) => {
        try {
            dispatch({ type: STOCK_VELOCITY_REQUEST });

            const config = getAuthConfig(getState);

            const { data } = await api.get(`/api/stock/velocity?days=${days}`, config);

            dispatch({
                type: STOCK_VELOCITY_SUCCESS,
                payload: data
            });
        } catch (error) {
            dispatch({
                type: STOCK_VELOCITY_FAIL,
                payload: error.response && error.response.data.message ? error.response.data.message : error.message
            });
        }
    };

// ==================== RESET ACTIONS ====================

export const resetProductStock = () => (dispatch) => {
    dispatch({ type: STOCK_PRODUCT_DETAILS_RESET });
};

export const resetStockAdjust = () => (dispatch) => {
    dispatch({ type: STOCK_ADJUST_RESET });
};

export const resetBulkAdjust = () => (dispatch) => {
    dispatch({ type: STOCK_BULK_ADJUST_RESET });
};

export const resetAlertAcknowledge = () => (dispatch) => {
    dispatch({ type: STOCK_ALERT_ACKNOWLEDGE_RESET });
};

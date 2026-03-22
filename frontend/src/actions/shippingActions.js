import {
    SHIPPING_DASHBOARD_REQUEST,
    SHIPPING_DASHBOARD_SUCCESS,
    SHIPPING_DASHBOARD_FAIL,
    SHIPPING_SERVICEABILITY_REQUEST,
    SHIPPING_SERVICEABILITY_SUCCESS,
    SHIPPING_SERVICEABILITY_FAIL,
    SHIPPING_CREATE_ORDER_REQUEST,
    SHIPPING_CREATE_ORDER_SUCCESS,
    SHIPPING_CREATE_ORDER_FAIL,
    SHIPPING_ASSIGN_COURIER_REQUEST,
    SHIPPING_ASSIGN_COURIER_SUCCESS,
    SHIPPING_ASSIGN_COURIER_FAIL,
    SHIPPING_SCHEDULE_PICKUP_REQUEST,
    SHIPPING_SCHEDULE_PICKUP_SUCCESS,
    SHIPPING_SCHEDULE_PICKUP_FAIL,
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
    SHIPPING_NDR_RTO_REQUEST,
    SHIPPING_NDR_RTO_SUCCESS,
    SHIPPING_NDR_RTO_FAIL,
    SHIPPING_CANCEL_REQUEST,
    SHIPPING_CANCEL_SUCCESS,
    SHIPPING_CANCEL_FAIL,
} from '../constants/shippingConstants';
import api, { getAuthConfig } from '../utils/api';

export const getShippingDashboard = () => async (dispatch, getState) => {
    try {
        dispatch({ type: SHIPPING_DASHBOARD_REQUEST });
        const config = getAuthConfig(getState);
        const { data } = await api.get('/api/shipping/dashboard', config);
        dispatch({ type: SHIPPING_DASHBOARD_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: SHIPPING_DASHBOARD_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const checkServiceability = (pickupPostcode, deliveryPostcode, weight, cod = false) => async (dispatch, getState) => {
    try {
        dispatch({ type: SHIPPING_SERVICEABILITY_REQUEST });
        const config = getAuthConfig(getState);
        const { data } = await api.get(
            `/api/shipping/serviceability?pickup_postcode=${pickupPostcode}&delivery_postcode=${deliveryPostcode}&weight=${weight}&cod=${cod ? 1 : 0}`,
            config
        );
        dispatch({ type: SHIPPING_SERVICEABILITY_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: SHIPPING_SERVICEABILITY_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const createShippingOrder = (orderId, weightAndDimensions = {}) => async (dispatch, getState) => {
    try {
        dispatch({ type: SHIPPING_CREATE_ORDER_REQUEST });
        const config = getAuthConfig(getState);
        const { data } = await api.post(`/api/shipping/orders/${orderId}/create`, weightAndDimensions, config);
        dispatch({ type: SHIPPING_CREATE_ORDER_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: SHIPPING_CREATE_ORDER_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const assignCourier = (orderId, courierId) => async (dispatch, getState) => {
    try {
        dispatch({ type: SHIPPING_ASSIGN_COURIER_REQUEST });
        const config = getAuthConfig(getState);
        const { data } = await api.post(`/api/shipping/orders/${orderId}/assign-courier`, { courierId }, config);
        dispatch({ type: SHIPPING_ASSIGN_COURIER_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: SHIPPING_ASSIGN_COURIER_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const schedulePickup = (orderId) => async (dispatch, getState) => {
    try {
        dispatch({ type: SHIPPING_SCHEDULE_PICKUP_REQUEST });
        const config = getAuthConfig(getState);
        const { data } = await api.post(`/api/shipping/orders/${orderId}/pickup`, {}, config);
        dispatch({ type: SHIPPING_SCHEDULE_PICKUP_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: SHIPPING_SCHEDULE_PICKUP_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const generateLabel = (orderId) => async (dispatch, getState) => {
    try {
        dispatch({ type: SHIPPING_GENERATE_LABEL_REQUEST });
        const config = getAuthConfig(getState);
        const { data } = await api.get(`/api/shipping/orders/${orderId}/label`, config);
        dispatch({ type: SHIPPING_GENERATE_LABEL_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: SHIPPING_GENERATE_LABEL_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const generateManifest = (orderId) => async (dispatch, getState) => {
    try {
        dispatch({ type: SHIPPING_GENERATE_MANIFEST_REQUEST });
        const config = getAuthConfig(getState);
        const { data } = await api.post(`/api/shipping/orders/${orderId}/manifest`, {}, config);
        dispatch({ type: SHIPPING_GENERATE_MANIFEST_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: SHIPPING_GENERATE_MANIFEST_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const trackShippingOrder = (orderId) => async (dispatch, getState) => {
    try {
        dispatch({ type: SHIPPING_TRACK_ORDER_REQUEST });
        const config = getAuthConfig(getState);
        const { data } = await api.get(`/api/shipping/orders/${orderId}/track`, config);
        dispatch({ type: SHIPPING_TRACK_ORDER_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: SHIPPING_TRACK_ORDER_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const getNdrList = (page = 1, courier = '') => async (dispatch, getState) => {
    try {
        dispatch({ type: SHIPPING_NDR_LIST_REQUEST });
        const config = getAuthConfig(getState);
        const { data } = await api.get(
            `/api/shipping/ndr?page=${page}&courier=${courier}`,
            config
        );
        dispatch({ type: SHIPPING_NDR_LIST_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: SHIPPING_NDR_LIST_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const reattemptDelivery = (orderId, reattemptData) => async (dispatch, getState) => {
    try {
        dispatch({ type: SHIPPING_NDR_REATTEMPT_REQUEST });
        const config = getAuthConfig(getState);
        const { data } = await api.post(`/api/shipping/ndr/${orderId}/reattempt`, reattemptData, config);
        dispatch({ type: SHIPPING_NDR_REATTEMPT_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: SHIPPING_NDR_REATTEMPT_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const initiateRTO = (orderId, reason = '') => async (dispatch, getState) => {
    try {
        dispatch({ type: SHIPPING_NDR_RTO_REQUEST });
        const config = getAuthConfig(getState);
        const { data } = await api.post(`/api/shipping/ndr/${orderId}/rto`, { reason }, config);
        dispatch({ type: SHIPPING_NDR_RTO_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: SHIPPING_NDR_RTO_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const cancelShipment = (orderId) => async (dispatch, getState) => {
    try {
        dispatch({ type: SHIPPING_CANCEL_REQUEST });
        const config = getAuthConfig(getState);
        const { data } = await api.post(`/api/shipping/orders/${orderId}/cancel-shipment`, {}, config);
        dispatch({ type: SHIPPING_CANCEL_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: SHIPPING_CANCEL_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

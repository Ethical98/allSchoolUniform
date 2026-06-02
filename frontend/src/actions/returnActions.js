import api from '../utils/api';
import {
  RETURN_LIST_REQUEST, RETURN_LIST_SUCCESS, RETURN_LIST_FAIL,
  RETURN_DETAILS_REQUEST, RETURN_DETAILS_SUCCESS, RETURN_DETAILS_FAIL,
  RETURN_CREATE_REQUEST, RETURN_CREATE_SUCCESS, RETURN_CREATE_FAIL,
  RETURN_UPDATE_STATUS_REQUEST, RETURN_UPDATE_STATUS_SUCCESS, RETURN_UPDATE_STATUS_FAIL,
  RETURN_QC_UPDATE_REQUEST, RETURN_QC_UPDATE_SUCCESS, RETURN_QC_UPDATE_FAIL,
  RETURN_CREDIT_NOTE_REQUEST, RETURN_CREDIT_NOTE_SUCCESS, RETURN_CREDIT_NOTE_FAIL,
  RETURN_EXCHANGE_ORDER_REQUEST, RETURN_EXCHANGE_ORDER_SUCCESS, RETURN_EXCHANGE_ORDER_FAIL,
  RETURN_REFUND_REQUEST, RETURN_REFUND_SUCCESS, RETURN_REFUND_FAIL,
  RETURN_DASHBOARD_REQUEST, RETURN_DASHBOARD_SUCCESS, RETURN_DASHBOARD_FAIL,
  RETURN_BY_ORDER_REQUEST, RETURN_BY_ORDER_SUCCESS, RETURN_BY_ORDER_FAIL,
  RETURN_NOTE_REQUEST, RETURN_NOTE_SUCCESS, RETURN_NOTE_FAIL,
  RETURN_LABEL_REQUEST, RETURN_LABEL_SUCCESS, RETURN_LABEL_FAIL, RETURN_LABEL_RESET,
  RETURN_INITIATE_PICKUP_REQUEST, RETURN_INITIATE_PICKUP_SUCCESS, RETURN_INITIATE_PICKUP_FAIL,
} from '../constants/returnConstants';

const getConfig = (getState) => {
  const { userLogin: { userInfo } } = getState();
  return { headers: { Authorization: `Bearer ${userInfo.token}` } };
};

export const listReturns = (page = 1, keyword = '', status = '', type = '', fromDate = '', toDate = '') => async (dispatch, getState) => {
  try {
    dispatch({ type: RETURN_LIST_REQUEST });
    const config = getConfig(getState);
    const { data } = await api.get(
      `/api/returns?page=${page}&keyword=${keyword}&status=${status}&type=${type}&fromDate=${fromDate}&toDate=${toDate}`,
      config
    );
    dispatch({ type: RETURN_LIST_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: RETURN_LIST_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const getReturnDetails = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: RETURN_DETAILS_REQUEST });
    const config = getConfig(getState);
    const { data } = await api.get(`/api/returns/${id}`, config);
    dispatch({ type: RETURN_DETAILS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: RETURN_DETAILS_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const createReturn = (returnData) => async (dispatch, getState) => {
  try {
    dispatch({ type: RETURN_CREATE_REQUEST });
    const config = getConfig(getState);
    const { data } = await api.post('/api/returns', returnData, config);
    dispatch({ type: RETURN_CREATE_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: RETURN_CREATE_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const updateReturnStatus = (id, statusData) => async (dispatch, getState) => {
  try {
    dispatch({ type: RETURN_UPDATE_STATUS_REQUEST });
    const config = getConfig(getState);
    const { data } = await api.patch(`/api/returns/${id}/status`, statusData, config);
    dispatch({ type: RETURN_UPDATE_STATUS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: RETURN_UPDATE_STATUS_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const updateQCDisposition = (id, items) => async (dispatch, getState) => {
  try {
    dispatch({ type: RETURN_QC_UPDATE_REQUEST });
    const config = getConfig(getState);
    const { data } = await api.patch(`/api/returns/${id}/qc`, { items }, config);
    dispatch({ type: RETURN_QC_UPDATE_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: RETURN_QC_UPDATE_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const generateCreditNote = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: RETURN_CREDIT_NOTE_REQUEST });
    const config = getConfig(getState);
    const { data } = await api.post(`/api/returns/${id}/credit-note`, {}, config);
    dispatch({ type: RETURN_CREDIT_NOTE_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: RETURN_CREDIT_NOTE_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const createExchangeOrder = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: RETURN_EXCHANGE_ORDER_REQUEST });
    const config = getConfig(getState);
    const { data } = await api.post(`/api/returns/${id}/exchange-order`, {}, config);
    dispatch({ type: RETURN_EXCHANGE_ORDER_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: RETURN_EXCHANGE_ORDER_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const processRefund = (id, refundData) => async (dispatch, getState) => {
  try {
    dispatch({ type: RETURN_REFUND_REQUEST });
    const config = getConfig(getState);
    const { data } = await api.patch(`/api/returns/${id}/refund`, refundData, config);
    dispatch({ type: RETURN_REFUND_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: RETURN_REFUND_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const getReturnsDashboard = () => async (dispatch, getState) => {
  try {
    dispatch({ type: RETURN_DASHBOARD_REQUEST });
    const config = getConfig(getState);
    const { data } = await api.get('/api/returns/dashboard', config);
    dispatch({ type: RETURN_DASHBOARD_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: RETURN_DASHBOARD_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const getReturnsByOrder = (orderId) => async (dispatch, getState) => {
  try {
    dispatch({ type: RETURN_BY_ORDER_REQUEST });
    const config = getConfig(getState);
    const { data } = await api.get(`/api/returns/order/${orderId}`, config);
    dispatch({ type: RETURN_BY_ORDER_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: RETURN_BY_ORDER_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const addReturnNote = (id, note) => async (dispatch, getState) => {
  try {
    dispatch({ type: RETURN_NOTE_REQUEST });
    const config = getConfig(getState);
    const { data } = await api.post(`/api/returns/${id}/notes`, { note }, config);
    dispatch({ type: RETURN_NOTE_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: RETURN_NOTE_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const initiateReturnPickup = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: RETURN_INITIATE_PICKUP_REQUEST });
    const config = getConfig(getState);
    const { data } = await api.post(`/api/returns/${id}/initiate-pickup`, {}, config);
    dispatch({ type: RETURN_INITIATE_PICKUP_SUCCESS, payload: data });
    dispatch(getReturnDetails(id));
  } catch (error) {
    dispatch({ type: RETURN_INITIATE_PICKUP_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const generateReturnLabel = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: RETURN_LABEL_REQUEST });
    const config = getConfig(getState);
    const { data } = await api.get(`/api/returns/${id}/label`, config);
    dispatch({ type: RETURN_LABEL_SUCCESS, payload: data });
    dispatch(getReturnDetails(id));
  } catch (error) {
    dispatch({ type: RETURN_LABEL_FAIL, payload: error.response?.data?.message || error.message });
  }
};

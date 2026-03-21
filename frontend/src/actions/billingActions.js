import {
    QUOTATION_LIST_REQUEST, QUOTATION_LIST_SUCCESS, QUOTATION_LIST_FAIL,
    QUOTATION_DETAILS_REQUEST, QUOTATION_DETAILS_SUCCESS, QUOTATION_DETAILS_FAIL,
    QUOTATION_CREATE_REQUEST, QUOTATION_CREATE_SUCCESS, QUOTATION_CREATE_FAIL,
    QUOTATION_UPDATE_REQUEST, QUOTATION_UPDATE_SUCCESS, QUOTATION_UPDATE_FAIL,
    QUOTATION_DELETE_REQUEST, QUOTATION_DELETE_SUCCESS, QUOTATION_DELETE_FAIL,
    QUOTATION_STATUS_REQUEST, QUOTATION_STATUS_SUCCESS, QUOTATION_STATUS_FAIL,
    QUOTATION_CONVERT_REQUEST, QUOTATION_CONVERT_SUCCESS, QUOTATION_CONVERT_FAIL,
    QUOTATION_CLONE_REQUEST, QUOTATION_CLONE_SUCCESS, QUOTATION_CLONE_FAIL,
    PRODUCT_PICKER_REQUEST, PRODUCT_PICKER_SUCCESS, PRODUCT_PICKER_FAIL,
    CASH_BILL_CREATE_REQUEST, CASH_BILL_CREATE_SUCCESS, CASH_BILL_CREATE_FAIL,
    TEMPLATE_LIST_REQUEST, TEMPLATE_LIST_SUCCESS, TEMPLATE_LIST_FAIL,
    TEMPLATE_CREATE_REQUEST, TEMPLATE_CREATE_SUCCESS, TEMPLATE_CREATE_FAIL,
    TEMPLATE_UPDATE_REQUEST, TEMPLATE_UPDATE_SUCCESS, TEMPLATE_UPDATE_FAIL,
    TEMPLATE_DELETE_REQUEST, TEMPLATE_DELETE_SUCCESS, TEMPLATE_DELETE_FAIL,
    RECORD_PAYMENT_REQUEST, RECORD_PAYMENT_SUCCESS, RECORD_PAYMENT_FAIL,
    CREDIT_NOTE_CREATE_REQUEST, CREDIT_NOTE_CREATE_SUCCESS, CREDIT_NOTE_CREATE_FAIL,
    DEBIT_NOTE_CREATE_REQUEST, DEBIT_NOTE_CREATE_SUCCESS, DEBIT_NOTE_CREATE_FAIL,
    BILLING_REPORT_REQUEST, BILLING_REPORT_SUCCESS, BILLING_REPORT_FAIL,
    BILLING_CONFIG_REQUEST, BILLING_CONFIG_SUCCESS, BILLING_CONFIG_FAIL,
    BILLING_CONFIG_UPDATE_REQUEST, BILLING_CONFIG_UPDATE_SUCCESS, BILLING_CONFIG_UPDATE_FAIL,
    QUOTATION_DETAILS_RESET, QUOTATION_CREATE_RESET, QUOTATION_UPDATE_RESET,
    QUOTATION_STATUS_RESET, QUOTATION_CONVERT_RESET, QUOTATION_CLONE_RESET,
    PRODUCT_PICKER_RESET, CASH_BILL_CREATE_RESET, TEMPLATE_CREATE_RESET,
    TEMPLATE_UPDATE_RESET, RECORD_PAYMENT_RESET,
    CREDIT_NOTE_CREATE_RESET, DEBIT_NOTE_CREATE_RESET,
    BILLING_CONFIG_UPDATE_RESET,
} from '../constants/billingConstants';
import api, { getAuthConfig } from '../utils/api';

// ==================== QUOTATION ACTIONS ====================

export const listQuotations =
    (page = '', documentType = '', status = '', search = '', startDate = '', endDate = '') =>
    async (dispatch, getState) => {
        try {
            dispatch({ type: QUOTATION_LIST_REQUEST });

            const config = getAuthConfig(getState);

            const { data } = await api.get(
                `/api/billing/quotations?page=${page}&documentType=${documentType}&status=${status}&search=${search}&startDate=${startDate}&endDate=${endDate}`,
                config
            );

            dispatch({ type: QUOTATION_LIST_SUCCESS, payload: data });
        } catch (error) {
            dispatch({
                type: QUOTATION_LIST_FAIL,
                payload: error.response && error.response.data.message ? error.response.data.message : error.message
            });
        }
    };

export const getQuotationDetails = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: QUOTATION_DETAILS_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.get(`/api/billing/quotations/${id}`, config);

        dispatch({ type: QUOTATION_DETAILS_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: QUOTATION_DETAILS_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const createQuotation = (quotationData) => async (dispatch, getState) => {
    try {
        dispatch({ type: QUOTATION_CREATE_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.post('/api/billing/quotations', quotationData, config);

        dispatch({ type: QUOTATION_CREATE_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: QUOTATION_CREATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const updateQuotation = (id, quotationData) => async (dispatch, getState) => {
    try {
        dispatch({ type: QUOTATION_UPDATE_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.put(`/api/billing/quotations/${id}`, quotationData, config);

        dispatch({ type: QUOTATION_UPDATE_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: QUOTATION_UPDATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const deleteQuotation = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: QUOTATION_DELETE_REQUEST });

        const config = getAuthConfig(getState);

        await api.delete(`/api/billing/quotations/${id}`, config);

        dispatch({ type: QUOTATION_DELETE_SUCCESS });
    } catch (error) {
        dispatch({
            type: QUOTATION_DELETE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const updateQuotationStatus = (id, status) => async (dispatch, getState) => {
    try {
        dispatch({ type: QUOTATION_STATUS_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.patch(`/api/billing/quotations/${id}/status`, { status }, config);

        dispatch({ type: QUOTATION_STATUS_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: QUOTATION_STATUS_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const convertQuotation = (id, documentType) => async (dispatch, getState) => {
    try {
        dispatch({ type: QUOTATION_CONVERT_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.post(`/api/billing/quotations/${id}/convert`, { documentType }, config);

        dispatch({ type: QUOTATION_CONVERT_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: QUOTATION_CONVERT_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const cloneQuotation = (id, documentType) => async (dispatch, getState) => {
    try {
        dispatch({ type: QUOTATION_CLONE_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.post(`/api/billing/quotations/${id}/clone`, { documentType }, config);

        dispatch({ type: QUOTATION_CLONE_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: QUOTATION_CLONE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const searchProductsForPicker =
    (search = '') =>
    async (dispatch, getState) => {
        try {
            dispatch({ type: PRODUCT_PICKER_REQUEST });

            const config = getAuthConfig(getState);

            const { data } = await api.get(`/api/billing/quotations/products?search=${search}`, config);

            dispatch({ type: PRODUCT_PICKER_SUCCESS, payload: data });
        } catch (error) {
            dispatch({
                type: PRODUCT_PICKER_FAIL,
                payload: error.response && error.response.data.message ? error.response.data.message : error.message
            });
        }
    };

export const createCashBill = (billData) => async (dispatch, getState) => {
    try {
        dispatch({ type: CASH_BILL_CREATE_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.post('/api/billing/cash-bill', billData, config);

        dispatch({ type: CASH_BILL_CREATE_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: CASH_BILL_CREATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

// ==================== TEMPLATE ACTIONS ====================

export const listTemplates =
    (type = '') =>
    async (dispatch, getState) => {
        try {
            dispatch({ type: TEMPLATE_LIST_REQUEST });

            const config = getAuthConfig(getState);

            const { data } = await api.get(`/api/billing/templates?type=${type}`, config);

            dispatch({ type: TEMPLATE_LIST_SUCCESS, payload: data });
        } catch (error) {
            dispatch({
                type: TEMPLATE_LIST_FAIL,
                payload: error.response && error.response.data.message ? error.response.data.message : error.message
            });
        }
    };

export const createTemplate = (templateData) => async (dispatch, getState) => {
    try {
        dispatch({ type: TEMPLATE_CREATE_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.post('/api/billing/templates', templateData, config);

        dispatch({ type: TEMPLATE_CREATE_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: TEMPLATE_CREATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const updateTemplate = (id, templateData) => async (dispatch, getState) => {
    try {
        dispatch({ type: TEMPLATE_UPDATE_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.put(`/api/billing/templates/${id}`, templateData, config);

        dispatch({ type: TEMPLATE_UPDATE_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: TEMPLATE_UPDATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const deleteTemplate = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: TEMPLATE_DELETE_REQUEST });

        const config = getAuthConfig(getState);

        await api.delete(`/api/billing/templates/${id}`, config);

        dispatch({ type: TEMPLATE_DELETE_SUCCESS });
    } catch (error) {
        dispatch({
            type: TEMPLATE_DELETE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

// ==================== PAYMENT ACTIONS ====================

export const recordPayment = (id, paymentData) => async (dispatch, getState) => {
    try {
        dispatch({ type: RECORD_PAYMENT_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.post(`/api/billing/quotations/${id}/payment`, paymentData, config);

        dispatch({ type: RECORD_PAYMENT_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: RECORD_PAYMENT_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

// ==================== CREDIT NOTE / DEBIT NOTE ACTIONS ====================

export const createCreditNote = (noteData) => async (dispatch, getState) => {
    try {
        dispatch({ type: CREDIT_NOTE_CREATE_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.post('/api/billing/credit-note', noteData, config);

        dispatch({ type: CREDIT_NOTE_CREATE_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: CREDIT_NOTE_CREATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const createDebitNote = (noteData) => async (dispatch, getState) => {
    try {
        dispatch({ type: DEBIT_NOTE_CREATE_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.post('/api/billing/debit-note', noteData, config);

        dispatch({ type: DEBIT_NOTE_CREATE_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: DEBIT_NOTE_CREATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

// ==================== BILLING REPORT ====================

export const getBillingReport =
    (startDate = '', endDate = '', documentType = '', buyerName = '') =>
    async (dispatch, getState) => {
        try {
            dispatch({ type: BILLING_REPORT_REQUEST });

            const config = getAuthConfig(getState);

            const { data } = await api.get(
                `/api/billing/report?startDate=${startDate}&endDate=${endDate}&documentType=${documentType}&buyerName=${buyerName}`,
                config
            );

            dispatch({ type: BILLING_REPORT_SUCCESS, payload: data });
        } catch (error) {
            dispatch({
                type: BILLING_REPORT_FAIL,
                payload: error.response && error.response.data.message ? error.response.data.message : error.message
            });
        }
    };

export const getBillingConfig = () => async (dispatch, getState) => {
    try {
        dispatch({ type: BILLING_CONFIG_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.get('/api/billing/config', config);

        dispatch({ type: BILLING_CONFIG_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: BILLING_CONFIG_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

// ==================== RESET ACTIONS ====================

export const resetQuotationDetails = () => (dispatch) => {
    dispatch({ type: QUOTATION_DETAILS_RESET });
};

export const resetQuotationCreate = () => (dispatch) => {
    dispatch({ type: QUOTATION_CREATE_RESET });
};

export const resetQuotationUpdate = () => (dispatch) => {
    dispatch({ type: QUOTATION_UPDATE_RESET });
};

export const resetQuotationStatus = () => (dispatch) => {
    dispatch({ type: QUOTATION_STATUS_RESET });
};

export const resetQuotationConvert = () => (dispatch) => {
    dispatch({ type: QUOTATION_CONVERT_RESET });
};

export const resetQuotationClone = () => (dispatch) => {
    dispatch({ type: QUOTATION_CLONE_RESET });
};

export const resetProductPicker = () => (dispatch) => {
    dispatch({ type: PRODUCT_PICKER_RESET });
};

export const resetCashBillCreate = () => (dispatch) => {
    dispatch({ type: CASH_BILL_CREATE_RESET });
};

export const resetTemplateCreate = () => (dispatch) => {
    dispatch({ type: TEMPLATE_CREATE_RESET });
};

export const resetTemplateUpdate = () => (dispatch) => {
    dispatch({ type: TEMPLATE_UPDATE_RESET });
};

export const resetRecordPayment = () => (dispatch) => {
    dispatch({ type: RECORD_PAYMENT_RESET });
};

export const resetCreditNoteCreate = () => (dispatch) => {
    dispatch({ type: CREDIT_NOTE_CREATE_RESET });
};

export const resetDebitNoteCreate = () => (dispatch) => {
    dispatch({ type: DEBIT_NOTE_CREATE_RESET });
};

export const resetBillingConfigUpdate = () => (dispatch) => {
    dispatch({ type: BILLING_CONFIG_UPDATE_RESET });
};

// ==================== BILLING CONFIG ====================

export const updateBillingConfig = (configData) => async (dispatch, getState) => {
    try {
        dispatch({ type: BILLING_CONFIG_UPDATE_REQUEST });

        const reqConfig = getAuthConfig(getState);

        const { data } = await api.put('/api/billing/config', configData, reqConfig);

        dispatch({ type: BILLING_CONFIG_UPDATE_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: BILLING_CONFIG_UPDATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

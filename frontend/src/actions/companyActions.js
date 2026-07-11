import {
    COMPANY_LIST_REQUEST, COMPANY_LIST_SUCCESS, COMPANY_LIST_FAIL,
    COMPANY_DETAILS_REQUEST, COMPANY_DETAILS_SUCCESS, COMPANY_DETAILS_FAIL,
    COMPANY_CREATE_REQUEST, COMPANY_CREATE_SUCCESS, COMPANY_CREATE_FAIL,
    COMPANY_UPDATE_REQUEST, COMPANY_UPDATE_SUCCESS, COMPANY_UPDATE_FAIL,
    COMPANY_DELETE_REQUEST, COMPANY_DELETE_SUCCESS, COMPANY_DELETE_FAIL,
    COMPANY_SEARCH_REQUEST, COMPANY_SEARCH_SUCCESS, COMPANY_SEARCH_FAIL,
    COMPANY_DETAILS_RESET, COMPANY_CREATE_RESET, COMPANY_UPDATE_RESET, COMPANY_SEARCH_RESET,
} from '../constants/companyConstants';
import api, { getAuthConfig } from '../utils/api';

export const listCompanies =
    (page = '', type = '', search = '') =>
    async (dispatch, getState) => {
        try {
            dispatch({ type: COMPANY_LIST_REQUEST });

            const config = getAuthConfig(getState);

            const { data } = await api.get(
                `/api/billing/companies?page=${page}&type=${type}&search=${search}`,
                config
            );

            dispatch({ type: COMPANY_LIST_SUCCESS, payload: data });
        } catch (error) {
            dispatch({
                type: COMPANY_LIST_FAIL,
                payload: error.response && error.response.data.message ? error.response.data.message : error.message
            });
        }
    };

export const getCompanyDetails = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: COMPANY_DETAILS_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.get(`/api/billing/companies/${id}`, config);

        dispatch({ type: COMPANY_DETAILS_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: COMPANY_DETAILS_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const createCompany = (companyData) => async (dispatch, getState) => {
    try {
        dispatch({ type: COMPANY_CREATE_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.post('/api/billing/companies', companyData, config);

        dispatch({ type: COMPANY_CREATE_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: COMPANY_CREATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const updateCompany = (id, companyData) => async (dispatch, getState) => {
    try {
        dispatch({ type: COMPANY_UPDATE_REQUEST });

        const config = getAuthConfig(getState);

        const { data } = await api.put(`/api/billing/companies/${id}`, companyData, config);

        dispatch({ type: COMPANY_UPDATE_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: COMPANY_UPDATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const deleteCompany = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: COMPANY_DELETE_REQUEST });

        const config = getAuthConfig(getState);

        await api.delete(`/api/billing/companies/${id}`, config);

        dispatch({ type: COMPANY_DELETE_SUCCESS });
    } catch (error) {
        dispatch({
            type: COMPANY_DELETE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const searchCompanies =
    (query = '', type = '') =>
    async (dispatch, getState) => {
        try {
            dispatch({ type: COMPANY_SEARCH_REQUEST });

            const config = getAuthConfig(getState);

            const { data } = await api.get(
                `/api/billing/companies/search?q=${query}&type=${type}`,
                config
            );

            dispatch({ type: COMPANY_SEARCH_SUCCESS, payload: data });
        } catch (error) {
            dispatch({
                type: COMPANY_SEARCH_FAIL,
                payload: error.response && error.response.data.message ? error.response.data.message : error.message
            });
        }
    };

// ==================== RESET ACTIONS ====================

export const resetCompanyDetails = () => (dispatch) => {
    dispatch({ type: COMPANY_DETAILS_RESET });
};

export const resetCompanyCreate = () => (dispatch) => {
    dispatch({ type: COMPANY_CREATE_RESET });
};

export const resetCompanyUpdate = () => (dispatch) => {
    dispatch({ type: COMPANY_UPDATE_RESET });
};

export const resetCompanySearch = () => (dispatch) => {
    dispatch({ type: COMPANY_SEARCH_RESET });
};

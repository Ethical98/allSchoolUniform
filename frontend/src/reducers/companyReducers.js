import {
    COMPANY_LIST_REQUEST, COMPANY_LIST_SUCCESS, COMPANY_LIST_FAIL,
    COMPANY_DETAILS_REQUEST, COMPANY_DETAILS_SUCCESS, COMPANY_DETAILS_FAIL, COMPANY_DETAILS_RESET,
    COMPANY_CREATE_REQUEST, COMPANY_CREATE_SUCCESS, COMPANY_CREATE_FAIL, COMPANY_CREATE_RESET,
    COMPANY_UPDATE_REQUEST, COMPANY_UPDATE_SUCCESS, COMPANY_UPDATE_FAIL, COMPANY_UPDATE_RESET,
    COMPANY_DELETE_REQUEST, COMPANY_DELETE_SUCCESS, COMPANY_DELETE_FAIL,
    COMPANY_SEARCH_REQUEST, COMPANY_SEARCH_SUCCESS, COMPANY_SEARCH_FAIL, COMPANY_SEARCH_RESET
} from '../constants/companyConstants';

export const companyListReducer = (state = { companies: [] }, action) => {
    switch (action.type) {
        case COMPANY_LIST_REQUEST:
            return { ...state, loading: true, error: null };
        case COMPANY_LIST_SUCCESS:
            return {
                loading: false,
                companies: action.payload.companies,
                page: action.payload.page,
                pages: action.payload.pages,
                total: action.payload.total
            };
        case COMPANY_LIST_FAIL:
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export const companyDetailsReducer = (state = { company: {} }, action) => {
    switch (action.type) {
        case COMPANY_DETAILS_REQUEST:
            return { ...state, loading: true, error: null };
        case COMPANY_DETAILS_SUCCESS:
            return { loading: false, company: action.payload };
        case COMPANY_DETAILS_FAIL:
            return { ...state, loading: false, error: action.payload };
        case COMPANY_DETAILS_RESET:
            return { company: {} };
        default:
            return state;
    }
};

export const companyCreateReducer = (state = {}, action) => {
    switch (action.type) {
        case COMPANY_CREATE_REQUEST:
            return { loading: true };
        case COMPANY_CREATE_SUCCESS:
            return { loading: false, success: true, company: action.payload };
        case COMPANY_CREATE_FAIL:
            return { loading: false, error: action.payload };
        case COMPANY_CREATE_RESET:
            return {};
        default:
            return state;
    }
};

export const companyUpdateReducer = (state = {}, action) => {
    switch (action.type) {
        case COMPANY_UPDATE_REQUEST:
            return { loading: true };
        case COMPANY_UPDATE_SUCCESS:
            return { loading: false, success: true, company: action.payload };
        case COMPANY_UPDATE_FAIL:
            return { loading: false, error: action.payload };
        case COMPANY_UPDATE_RESET:
            return {};
        default:
            return state;
    }
};

export const companyDeleteReducer = (state = {}, action) => {
    switch (action.type) {
        case COMPANY_DELETE_REQUEST:
            return { loading: true };
        case COMPANY_DELETE_SUCCESS:
            return { loading: false, success: true };
        case COMPANY_DELETE_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const companySearchReducer = (state = { companies: [] }, action) => {
    switch (action.type) {
        case COMPANY_SEARCH_REQUEST:
            return { ...state, loading: true };
        case COMPANY_SEARCH_SUCCESS:
            return { loading: false, companies: action.payload };
        case COMPANY_SEARCH_FAIL:
            return { loading: false, error: action.payload };
        case COMPANY_SEARCH_RESET:
            return { companies: [] };
        default:
            return state;
    }
};

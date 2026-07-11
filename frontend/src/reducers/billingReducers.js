import {
    QUOTATION_LIST_REQUEST, QUOTATION_LIST_SUCCESS, QUOTATION_LIST_FAIL,
    QUOTATION_DETAILS_REQUEST, QUOTATION_DETAILS_SUCCESS, QUOTATION_DETAILS_FAIL, QUOTATION_DETAILS_RESET,
    QUOTATION_CREATE_REQUEST, QUOTATION_CREATE_SUCCESS, QUOTATION_CREATE_FAIL, QUOTATION_CREATE_RESET,
    QUOTATION_UPDATE_REQUEST, QUOTATION_UPDATE_SUCCESS, QUOTATION_UPDATE_FAIL, QUOTATION_UPDATE_RESET,
    QUOTATION_DELETE_REQUEST, QUOTATION_DELETE_SUCCESS, QUOTATION_DELETE_FAIL,
    QUOTATION_STATUS_REQUEST, QUOTATION_STATUS_SUCCESS, QUOTATION_STATUS_FAIL, QUOTATION_STATUS_RESET,
    QUOTATION_CONVERT_REQUEST, QUOTATION_CONVERT_SUCCESS, QUOTATION_CONVERT_FAIL, QUOTATION_CONVERT_RESET,
    QUOTATION_CLONE_REQUEST, QUOTATION_CLONE_SUCCESS, QUOTATION_CLONE_FAIL, QUOTATION_CLONE_RESET,
    PRODUCT_PICKER_REQUEST, PRODUCT_PICKER_SUCCESS, PRODUCT_PICKER_FAIL, PRODUCT_PICKER_RESET,
    CASH_BILL_CREATE_REQUEST, CASH_BILL_CREATE_SUCCESS, CASH_BILL_CREATE_FAIL, CASH_BILL_CREATE_RESET,
    TEMPLATE_LIST_REQUEST, TEMPLATE_LIST_SUCCESS, TEMPLATE_LIST_FAIL,
    TEMPLATE_CREATE_REQUEST, TEMPLATE_CREATE_SUCCESS, TEMPLATE_CREATE_FAIL, TEMPLATE_CREATE_RESET,
    TEMPLATE_UPDATE_REQUEST, TEMPLATE_UPDATE_SUCCESS, TEMPLATE_UPDATE_FAIL, TEMPLATE_UPDATE_RESET,
    TEMPLATE_DELETE_REQUEST, TEMPLATE_DELETE_SUCCESS, TEMPLATE_DELETE_FAIL,
    RECORD_PAYMENT_REQUEST, RECORD_PAYMENT_SUCCESS, RECORD_PAYMENT_FAIL, RECORD_PAYMENT_RESET,
    CREDIT_NOTE_CREATE_REQUEST, CREDIT_NOTE_CREATE_SUCCESS, CREDIT_NOTE_CREATE_FAIL, CREDIT_NOTE_CREATE_RESET,
    DEBIT_NOTE_CREATE_REQUEST, DEBIT_NOTE_CREATE_SUCCESS, DEBIT_NOTE_CREATE_FAIL, DEBIT_NOTE_CREATE_RESET,
    BILLING_REPORT_REQUEST, BILLING_REPORT_SUCCESS, BILLING_REPORT_FAIL,
    BILLING_CONFIG_REQUEST, BILLING_CONFIG_SUCCESS, BILLING_CONFIG_FAIL,
    BILLING_CONFIG_UPDATE_REQUEST, BILLING_CONFIG_UPDATE_SUCCESS, BILLING_CONFIG_UPDATE_FAIL, BILLING_CONFIG_UPDATE_RESET,
} from '../constants/billingConstants';

export const quotationListReducer = (state = { quotations: [] }, action) => {
    switch (action.type) {
        case QUOTATION_LIST_REQUEST:
            return { ...state, loading: true, error: null };
        case QUOTATION_LIST_SUCCESS:
            return {
                loading: false,
                quotations: action.payload.quotations,
                page: action.payload.page,
                pages: action.payload.pages,
                total: action.payload.total
            };
        case QUOTATION_LIST_FAIL:
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export const quotationDetailsReducer = (state = { quotation: {} }, action) => {
    switch (action.type) {
        case QUOTATION_DETAILS_REQUEST:
            return { ...state, loading: true, error: null };
        case QUOTATION_DETAILS_SUCCESS:
            return { loading: false, quotation: action.payload };
        case QUOTATION_DETAILS_FAIL:
            return { ...state, loading: false, error: action.payload };
        case QUOTATION_DETAILS_RESET:
            return { quotation: {} };
        default:
            return state;
    }
};

export const quotationCreateReducer = (state = {}, action) => {
    switch (action.type) {
        case QUOTATION_CREATE_REQUEST:
            return { loading: true };
        case QUOTATION_CREATE_SUCCESS:
            return { loading: false, success: true, quotation: action.payload };
        case QUOTATION_CREATE_FAIL:
            return { loading: false, error: action.payload };
        case QUOTATION_CREATE_RESET:
            return {};
        default:
            return state;
    }
};

export const quotationUpdateReducer = (state = {}, action) => {
    switch (action.type) {
        case QUOTATION_UPDATE_REQUEST:
            return { loading: true };
        case QUOTATION_UPDATE_SUCCESS:
            return { loading: false, success: true, quotation: action.payload };
        case QUOTATION_UPDATE_FAIL:
            return { loading: false, error: action.payload };
        case QUOTATION_UPDATE_RESET:
            return {};
        default:
            return state;
    }
};

export const quotationDeleteReducer = (state = {}, action) => {
    switch (action.type) {
        case QUOTATION_DELETE_REQUEST:
            return { loading: true };
        case QUOTATION_DELETE_SUCCESS:
            return { loading: false, success: true };
        case QUOTATION_DELETE_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const quotationStatusReducer = (state = {}, action) => {
    switch (action.type) {
        case QUOTATION_STATUS_REQUEST:
            return { loading: true };
        case QUOTATION_STATUS_SUCCESS:
            return { loading: false, success: true, quotation: action.payload };
        case QUOTATION_STATUS_FAIL:
            return { loading: false, error: action.payload };
        case QUOTATION_STATUS_RESET:
            return {};
        default:
            return state;
    }
};

export const quotationConvertReducer = (state = {}, action) => {
    switch (action.type) {
        case QUOTATION_CONVERT_REQUEST:
            return { loading: true };
        case QUOTATION_CONVERT_SUCCESS:
            return { loading: false, success: true, quotation: action.payload };
        case QUOTATION_CONVERT_FAIL:
            return { loading: false, error: action.payload };
        case QUOTATION_CONVERT_RESET:
            return {};
        default:
            return state;
    }
};

export const quotationCloneReducer = (state = {}, action) => {
    switch (action.type) {
        case QUOTATION_CLONE_REQUEST:
            return { loading: true };
        case QUOTATION_CLONE_SUCCESS:
            return { loading: false, success: true, quotation: action.payload };
        case QUOTATION_CLONE_FAIL:
            return { loading: false, error: action.payload };
        case QUOTATION_CLONE_RESET:
            return {};
        default:
            return state;
    }
};

export const productPickerReducer = (state = { products: [] }, action) => {
    switch (action.type) {
        case PRODUCT_PICKER_REQUEST:
            return { ...state, loading: true };
        case PRODUCT_PICKER_SUCCESS:
            return { loading: false, products: action.payload };
        case PRODUCT_PICKER_FAIL:
            return { loading: false, error: action.payload };
        case PRODUCT_PICKER_RESET:
            return { products: [] };
        default:
            return state;
    }
};

export const cashBillCreateReducer = (state = {}, action) => {
    switch (action.type) {
        case CASH_BILL_CREATE_REQUEST:
            return { loading: true };
        case CASH_BILL_CREATE_SUCCESS:
            return { loading: false, success: true, bill: action.payload };
        case CASH_BILL_CREATE_FAIL:
            return { loading: false, error: action.payload };
        case CASH_BILL_CREATE_RESET:
            return {};
        default:
            return state;
    }
};

export const templateListReducer = (state = { templates: [] }, action) => {
    switch (action.type) {
        case TEMPLATE_LIST_REQUEST:
            return { ...state, loading: true };
        case TEMPLATE_LIST_SUCCESS:
            return { loading: false, templates: action.payload };
        case TEMPLATE_LIST_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const templateCreateReducer = (state = {}, action) => {
    switch (action.type) {
        case TEMPLATE_CREATE_REQUEST:
            return { loading: true };
        case TEMPLATE_CREATE_SUCCESS:
            return { loading: false, success: true, template: action.payload };
        case TEMPLATE_CREATE_FAIL:
            return { loading: false, error: action.payload };
        case TEMPLATE_CREATE_RESET:
            return {};
        default:
            return state;
    }
};

export const templateUpdateReducer = (state = {}, action) => {
    switch (action.type) {
        case TEMPLATE_UPDATE_REQUEST:
            return { loading: true };
        case TEMPLATE_UPDATE_SUCCESS:
            return { loading: false, success: true, template: action.payload };
        case TEMPLATE_UPDATE_FAIL:
            return { loading: false, error: action.payload };
        case TEMPLATE_UPDATE_RESET:
            return {};
        default:
            return state;
    }
};

export const templateDeleteReducer = (state = {}, action) => {
    switch (action.type) {
        case TEMPLATE_DELETE_REQUEST:
            return { loading: true };
        case TEMPLATE_DELETE_SUCCESS:
            return { loading: false, success: true };
        case TEMPLATE_DELETE_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const recordPaymentReducer = (state = {}, action) => {
    switch (action.type) {
        case RECORD_PAYMENT_REQUEST:
            return { loading: true };
        case RECORD_PAYMENT_SUCCESS:
            return { loading: false, success: true, quotation: action.payload };
        case RECORD_PAYMENT_FAIL:
            return { loading: false, error: action.payload };
        case RECORD_PAYMENT_RESET:
            return {};
        default:
            return state;
    }
};

export const creditNoteCreateReducer = (state = {}, action) => {
    switch (action.type) {
        case CREDIT_NOTE_CREATE_REQUEST:
            return { loading: true };
        case CREDIT_NOTE_CREATE_SUCCESS:
            return { loading: false, success: true, creditNote: action.payload };
        case CREDIT_NOTE_CREATE_FAIL:
            return { loading: false, error: action.payload };
        case CREDIT_NOTE_CREATE_RESET:
            return {};
        default:
            return state;
    }
};

export const debitNoteCreateReducer = (state = {}, action) => {
    switch (action.type) {
        case DEBIT_NOTE_CREATE_REQUEST:
            return { loading: true };
        case DEBIT_NOTE_CREATE_SUCCESS:
            return { loading: false, success: true, debitNote: action.payload };
        case DEBIT_NOTE_CREATE_FAIL:
            return { loading: false, error: action.payload };
        case DEBIT_NOTE_CREATE_RESET:
            return {};
        default:
            return state;
    }
};

export const billingReportReducer = (state = {}, action) => {
    switch (action.type) {
        case BILLING_REPORT_REQUEST:
            return { loading: true };
        case BILLING_REPORT_SUCCESS:
            return { loading: false, report: action.payload };
        case BILLING_REPORT_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const billingConfigReducer = (state = { config: {} }, action) => {
    switch (action.type) {
        case BILLING_CONFIG_REQUEST:
            return { ...state, loading: true };
        case BILLING_CONFIG_SUCCESS:
            return { loading: false, config: action.payload };
        case BILLING_CONFIG_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const billingConfigUpdateReducer = (state = {}, action) => {
    switch (action.type) {
        case BILLING_CONFIG_UPDATE_REQUEST:
            return { loading: true };
        case BILLING_CONFIG_UPDATE_SUCCESS:
            return { loading: false, success: true };
        case BILLING_CONFIG_UPDATE_FAIL:
            return { loading: false, error: action.payload };
        case BILLING_CONFIG_UPDATE_RESET:
            return {};
        default:
            return state;
    }
};

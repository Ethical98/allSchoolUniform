import {
  RETURN_LIST_REQUEST, RETURN_LIST_SUCCESS, RETURN_LIST_FAIL, RETURN_LIST_RESET,
  RETURN_DETAILS_REQUEST, RETURN_DETAILS_SUCCESS, RETURN_DETAILS_FAIL, RETURN_DETAILS_RESET,
  RETURN_CREATE_REQUEST, RETURN_CREATE_SUCCESS, RETURN_CREATE_FAIL, RETURN_CREATE_RESET,
  RETURN_UPDATE_STATUS_REQUEST, RETURN_UPDATE_STATUS_SUCCESS, RETURN_UPDATE_STATUS_FAIL, RETURN_UPDATE_STATUS_RESET,
  RETURN_QC_UPDATE_REQUEST, RETURN_QC_UPDATE_SUCCESS, RETURN_QC_UPDATE_FAIL, RETURN_QC_UPDATE_RESET,
  RETURN_CREDIT_NOTE_REQUEST, RETURN_CREDIT_NOTE_SUCCESS, RETURN_CREDIT_NOTE_FAIL, RETURN_CREDIT_NOTE_RESET,
  RETURN_EXCHANGE_ORDER_REQUEST, RETURN_EXCHANGE_ORDER_SUCCESS, RETURN_EXCHANGE_ORDER_FAIL, RETURN_EXCHANGE_ORDER_RESET,
  RETURN_REFUND_REQUEST, RETURN_REFUND_SUCCESS, RETURN_REFUND_FAIL, RETURN_REFUND_RESET,
  RETURN_DASHBOARD_REQUEST, RETURN_DASHBOARD_SUCCESS, RETURN_DASHBOARD_FAIL,
  RETURN_BY_ORDER_REQUEST, RETURN_BY_ORDER_SUCCESS, RETURN_BY_ORDER_FAIL, RETURN_BY_ORDER_RESET,
  RETURN_NOTE_REQUEST, RETURN_NOTE_SUCCESS, RETURN_NOTE_FAIL, RETURN_NOTE_RESET,
  RETURN_LABEL_REQUEST, RETURN_LABEL_SUCCESS, RETURN_LABEL_FAIL, RETURN_LABEL_RESET,
  RETURN_INITIATE_PICKUP_REQUEST, RETURN_INITIATE_PICKUP_SUCCESS, RETURN_INITIATE_PICKUP_FAIL, RETURN_INITIATE_PICKUP_RESET,
} from '../constants/returnConstants';

export const returnListReducer = (state = { returns: [] }, action) => {
  switch (action.type) {
    case RETURN_LIST_REQUEST: return { loading: true, returns: [] };
    case RETURN_LIST_SUCCESS: return { loading: false, returns: action.payload.returns, pages: action.payload.pages, page: action.payload.page, total: action.payload.total };
    case RETURN_LIST_FAIL: return { loading: false, error: action.payload };
    case RETURN_LIST_RESET: return { returns: [] };
    default: return state;
  }
};

export const returnDetailsReducer = (state = { returnRequest: {}, nextStatuses: [], payment: null }, action) => {
  switch (action.type) {
    case RETURN_DETAILS_REQUEST: return { ...state, loading: true };
    case RETURN_DETAILS_SUCCESS: return { loading: false, returnRequest: action.payload.returnRequest, nextStatuses: action.payload.nextStatuses, payment: action.payload.payment || null };
    case RETURN_DETAILS_FAIL: return { loading: false, error: action.payload };
    case RETURN_DETAILS_RESET: return { returnRequest: {}, nextStatuses: [], payment: null };
    default: return state;
  }
};

export const returnCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case RETURN_CREATE_REQUEST: return { loading: true };
    case RETURN_CREATE_SUCCESS: return { loading: false, success: true, returnRequest: action.payload.returnRequest };
    case RETURN_CREATE_FAIL: return { loading: false, error: action.payload };
    case RETURN_CREATE_RESET: return {};
    default: return state;
  }
};

export const returnUpdateStatusReducer = (state = {}, action) => {
  switch (action.type) {
    case RETURN_UPDATE_STATUS_REQUEST: return { loading: true };
    case RETURN_UPDATE_STATUS_SUCCESS: return { loading: false, success: true };
    case RETURN_UPDATE_STATUS_FAIL: return { loading: false, error: action.payload };
    case RETURN_UPDATE_STATUS_RESET: return {};
    default: return state;
  }
};

export const returnQCUpdateReducer = (state = {}, action) => {
  switch (action.type) {
    case RETURN_QC_UPDATE_REQUEST: return { loading: true };
    case RETURN_QC_UPDATE_SUCCESS: return { loading: false, success: true };
    case RETURN_QC_UPDATE_FAIL: return { loading: false, error: action.payload };
    case RETURN_QC_UPDATE_RESET: return {};
    default: return state;
  }
};

export const returnCreditNoteReducer = (state = {}, action) => {
  switch (action.type) {
    case RETURN_CREDIT_NOTE_REQUEST: return { loading: true };
    case RETURN_CREDIT_NOTE_SUCCESS: return { loading: false, success: true, creditNote: action.payload.creditNote };
    case RETURN_CREDIT_NOTE_FAIL: return { loading: false, error: action.payload };
    case RETURN_CREDIT_NOTE_RESET: return {};
    default: return state;
  }
};

export const returnExchangeOrderReducer = (state = {}, action) => {
  switch (action.type) {
    case RETURN_EXCHANGE_ORDER_REQUEST: return { loading: true };
    case RETURN_EXCHANGE_ORDER_SUCCESS: return { loading: false, success: true, exchangeOrder: action.payload.exchangeOrder };
    case RETURN_EXCHANGE_ORDER_FAIL: return { loading: false, error: action.payload };
    case RETURN_EXCHANGE_ORDER_RESET: return {};
    default: return state;
  }
};

export const returnRefundReducer = (state = {}, action) => {
  switch (action.type) {
    case RETURN_REFUND_REQUEST: return { loading: true };
    case RETURN_REFUND_SUCCESS: return { loading: false, success: true };
    case RETURN_REFUND_FAIL: return { loading: false, error: action.payload };
    case RETURN_REFUND_RESET: return {};
    default: return state;
  }
};

export const returnDashboardReducer = (state = { stats: {} }, action) => {
  switch (action.type) {
    case RETURN_DASHBOARD_REQUEST: return { loading: true, stats: {} };
    case RETURN_DASHBOARD_SUCCESS: return { loading: false, stats: action.payload };
    case RETURN_DASHBOARD_FAIL: return { loading: false, error: action.payload };
    default: return state;
  }
};

export const returnByOrderReducer = (state = { returns: [] }, action) => {
  switch (action.type) {
    case RETURN_BY_ORDER_REQUEST: return { loading: true, returns: [] };
    case RETURN_BY_ORDER_SUCCESS: return { loading: false, returns: action.payload };
    case RETURN_BY_ORDER_FAIL: return { loading: false, error: action.payload };
    case RETURN_BY_ORDER_RESET: return { returns: [] };
    default: return state;
  }
};

export const returnNoteReducer = (state = {}, action) => {
  switch (action.type) {
    case RETURN_NOTE_REQUEST: return { loading: true };
    case RETURN_NOTE_SUCCESS: return { loading: false, success: true };
    case RETURN_NOTE_FAIL: return { loading: false, error: action.payload };
    case RETURN_NOTE_RESET: return {};
    default: return state;
  }
};

export const returnInitiatePickupReducer = (state = {}, action) => {
  switch (action.type) {
    case RETURN_INITIATE_PICKUP_REQUEST: return { loading: true };
    case RETURN_INITIATE_PICKUP_SUCCESS: return { loading: false, success: true };
    case RETURN_INITIATE_PICKUP_FAIL: return { loading: false, error: action.payload };
    case RETURN_INITIATE_PICKUP_RESET: return {};
    default: return state;
  }
};

export const returnLabelReducer = (state = {}, action) => {
  switch (action.type) {
    case RETURN_LABEL_REQUEST:
      return { loading: true };
    case RETURN_LABEL_SUCCESS:
      return { loading: false, success: true, labelUrl: action.payload.labelUrl };
    case RETURN_LABEL_FAIL:
      return { loading: false, error: action.payload };
    case RETURN_LABEL_RESET:
      return {};
    default:
      return state;
  }
};

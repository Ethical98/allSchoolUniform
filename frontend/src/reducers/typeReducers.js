import {
  TYPE_CREATE_FAIL,
  TYPE_CREATE_REQUEST,
  TYPE_CREATE_RESET,
  TYPE_CREATE_SUCCESS,
  TYPE_DELETE_FAIL,
  TYPE_DELETE_REQUEST,
  TYPE_DELETE_SUCCESS,
  TYPE_DETAILS_FAIL,
  TYPE_DETAILS_REQUEST,
  TYPE_DETAILS_RESET,
  TYPE_DETAILS_SUCCESS,
  TYPE_LIST_ALL_FAIL,
  TYPE_LIST_ALL_REQUEST,
  TYPE_LIST_ALL_SUCCESS,
  TYPE_LIST_FAIL,
  TYPE_LIST_REQUEST,
  TYPE_LIST_SUCCESS,
  TYPE_SIZES_LIST_FAIL,
  TYPE_SIZES_LIST_REQUEST,
  TYPE_SIZES_LIST_SUCCESS,
  TYPE_UPDATE_FAIL,
  TYPE_UPDATE_REQUEST,
  TYPE_UPDATE_RESET,
  TYPE_UPDATE_SUCCESS,
} from '../constants/typeConstants';

export const typeSizesListReducer = (state = { masterSizes: [] }, action) => {
  switch (action.type) {
    case TYPE_SIZES_LIST_REQUEST:
      return { loading: true };
    case TYPE_SIZES_LIST_SUCCESS:
      return { loading: false, masterSizes: action.payload };
    case TYPE_SIZES_LIST_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const typeListReducer = (state = { masterTypes: [] }, action) => {
  switch (action.type) {
    case TYPE_LIST_REQUEST:
      return { loading: true };
    case TYPE_LIST_SUCCESS:
      return { loading: false, masterTypes: action.payload };
    case TYPE_LIST_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const typeListAllReducer = (state = { types: [] }, action) => {
  switch (action.type) {
    case TYPE_LIST_ALL_REQUEST:
      return { loading: true };
    case TYPE_LIST_ALL_SUCCESS:
      return { loading: false, masterTypes: action.payload };
    case TYPE_LIST_ALL_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const typeDetailsReducer = (state = { type: {} }, action) => {
  switch (action.type) {
    case TYPE_DETAILS_REQUEST:
      return { loading: true, ...state };
    case TYPE_DETAILS_SUCCESS:
      return { loading: false, type: action.payload };
    case TYPE_DETAILS_FAIL:
      return { loading: false, error: action.payload };
    case TYPE_DETAILS_RESET:
      return { type: {} };
    default:
      return state;
  }
};

export const typeDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case TYPE_DELETE_REQUEST:
      return { loading: true };
    case TYPE_DELETE_SUCCESS:
      return { loading: false, success: true };
    case TYPE_DELETE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const typeCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case TYPE_CREATE_REQUEST:
      return { loading: true };
    case TYPE_CREATE_SUCCESS:
      return { loading: false, success: true, type: action.payload };
    case TYPE_CREATE_FAIL:
      return { loading: false, error: action.payload };
    case TYPE_CREATE_RESET:
      return {};
    default:
      return state;
  }
};

export const typeUpdateReducer = (state = { type: {} }, action) => {
  switch (action.type) {
    case TYPE_UPDATE_REQUEST:
      return { loading: true };
    case TYPE_UPDATE_SUCCESS:
      return { loading: false, success: true, type: action.payload };
    case TYPE_UPDATE_FAIL:
      return { loading: false, error: action.payload };
    case TYPE_UPDATE_RESET:
      return { type: {} };
    default:
      return state;
  }
};

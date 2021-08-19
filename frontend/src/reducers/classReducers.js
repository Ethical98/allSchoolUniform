import {
  CLASS_CREATE_FAIL,
  CLASS_CREATE_REQUEST,
  CLASS_CREATE_RESET,
  CLASS_CREATE_SUCCESS,
  CLASS_DELETE_FAIL,
  CLASS_DELETE_REQUEST,
  CLASS_DELETE_SUCCESS,
  CLASS_LIST_FAIL,
  CLASS_LIST_REQUEST,
  CLASS_LIST_SUCCESS,
  CLASS_UPDATE_FAIL,
  CLASS_UPDATE_REQUEST,
  CLASS_UPDATE_RESET,
  CLASS_UPDATE_SUCCESS,
} from '../constants/classConstants';

export const classListReducer = (state = { masterClasses: [] }, action) => {
  switch (action.type) {
    case CLASS_LIST_REQUEST:
      return { loading: true };
    case CLASS_LIST_SUCCESS:
      return { loading: false, masterClasses: action.payload };
    case CLASS_LIST_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const classDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case CLASS_DELETE_REQUEST:
      return { loading: true };
    case CLASS_DELETE_SUCCESS:
      return { loading: false, success: true };
    case CLASS_DELETE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const classCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case CLASS_CREATE_REQUEST:
      return { loading: true };
    case CLASS_CREATE_SUCCESS:
      return { loading: false, success: true, class: action.payload };
    case CLASS_CREATE_FAIL:
      return { loading: false, error: action.payload };
    case CLASS_CREATE_RESET:
      return {};
    default:
      return state;
  }
};

export const classUpdateReducer = (state = { class: {} }, action) => {
  switch (action.type) {
    case CLASS_UPDATE_REQUEST:
      return { loading: true };
    case CLASS_UPDATE_SUCCESS:
      return { loading: false, success: true, class: action.payload };
    case CLASS_UPDATE_FAIL:
      return { loading: false, error: action.payload };
    case CLASS_UPDATE_RESET:
      return { school: {} };
    default:
      return state;
  }
};

import {
  TYPE_LIST_FAIL,
  TYPE_LIST_REQUEST,
  TYPE_LIST_SUCCESS,
  TYPE_SIZES_LIST_FAIL,
  TYPE_SIZES_LIST_REQUEST,
  TYPE_SIZES_LIST_SUCCESS,
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

import {
  CLASS_LIST_FAIL,
  CLASS_LIST_REQUEST,
  CLASS_LIST_SUCCESS,
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

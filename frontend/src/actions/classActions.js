import axios from 'axios';
import {
  CLASS_LIST_FAIL,
  CLASS_LIST_REQUEST,
  CLASS_LIST_SUCCESS,
} from '../constants/classConstants';

export const listClasses = () => async (dispatch) => {
  try {
    dispatch({ type: CLASS_LIST_REQUEST });

    const { data } = await axios.get(`/api/classes`);

    dispatch({
      type: CLASS_LIST_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: CLASS_LIST_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

import axios from 'axios';
import {
  TYPE_LIST_FAIL,
  TYPE_LIST_REQUEST,
  TYPE_LIST_SUCCESS,
  TYPE_SIZES_LIST_FAIL,
  TYPE_SIZES_LIST_REQUEST,
  TYPE_SIZES_LIST_SUCCESS,
} from '../constants/typeConstants';

export const listTypes = () => async (dispatch, getState) => {
  try {
    dispatch({ type: TYPE_LIST_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get(`/api/types`, config);

    dispatch({
      type: TYPE_LIST_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: TYPE_LIST_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const listTypeSizes = (type) => async (dispatch, getState) => {
  try {
    dispatch({ type: TYPE_SIZES_LIST_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get(`/api/types/${type}/sizes`, config);

    dispatch({
      type: TYPE_SIZES_LIST_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: TYPE_SIZES_LIST_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

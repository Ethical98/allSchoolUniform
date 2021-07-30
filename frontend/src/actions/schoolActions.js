import axios from 'axios';
import {
  SCHOOL_LIST_FAIL,
  SCHOOL_LIST_REQUEST,
  SCHOOL_LIST_SUCCESS,
} from '../constants/schoolConstants';

export const listSchools = () => async (dispatch, getState) => {
  try {
    dispatch({ type: SCHOOL_LIST_REQUEST });
    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get('/api/schools', config);

    dispatch({
      type: SCHOOL_LIST_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: SCHOOL_LIST_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

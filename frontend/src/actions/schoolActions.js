import axios from 'axios';
import {
  SCHOOL_CREATE_FAIL,
  SCHOOL_CREATE_REQUEST,
  SCHOOL_CREATE_SUCCESS,
  SCHOOL_DELETE_FAIL,
  SCHOOL_DELETE_REQUEST,
  SCHOOL_DELETE_SUCCESS,
  SCHOOL_DETAILS_FAIL,
  SCHOOL_DETAILS_REQUEST,
  SCHOOL_DETAILS_SUCCESS,
  SCHOOL_LIST_FAIL,
  SCHOOL_LIST_REQUEST,
  SCHOOL_LIST_SUCCESS,
  SCHOOL_NAME_LIST_FAIL,
  SCHOOL_NAME_LIST_REQUEST,
  SCHOOL_NAME_LIST_SUCCESS,
  SCHOOL_UPDATE_FAIL,
  SCHOOL_UPDATE_REQUEST,
  SCHOOL_UPDATE_SUCCESS,
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

export const listSchoolNames = () => async (dispatch) => {
  try {
    dispatch({ type: SCHOOL_NAME_LIST_REQUEST });

    const { data } = await axios.get('/api/schools/name');

    dispatch({
      type: SCHOOL_NAME_LIST_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: SCHOOL_NAME_LIST_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const listSchoolDetails = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: SCHOOL_DETAILS_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get(`/api/schools/${id}`, config);

    dispatch({
      type: SCHOOL_DETAILS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: SCHOOL_DETAILS_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const updateSchool = (school) => async (dispatch, getState) => {
  try {
    dispatch({
      type: SCHOOL_UPDATE_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.put(
      `/api/schools/${school._id}`,
      school,
      config
    );
    dispatch({
      type: SCHOOL_UPDATE_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: SCHOOL_UPDATE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const deleteSchool = (id) => async (dispatch, getState) => {
  try {
    dispatch({
      type: SCHOOL_DELETE_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    await axios.delete(`/api/schools/${id}`, config);
    dispatch({
      type: SCHOOL_DELETE_SUCCESS,
    });
  } catch (error) {
    dispatch({
      type: SCHOOL_DELETE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const createSchool = (school) => async (dispatch, getState) => {
  try {
    dispatch({
      type: SCHOOL_CREATE_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.post(`/api/schools/`, school, config);
    dispatch({
      type: SCHOOL_CREATE_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: SCHOOL_CREATE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

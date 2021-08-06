import axios from 'axios';
import {
  TYPE_CREATE_FAIL,
  TYPE_CREATE_REQUEST,
  TYPE_CREATE_SUCCESS,
  TYPE_DELETE_FAIL,
  TYPE_DELETE_REQUEST,
  TYPE_DELETE_SUCCESS,
  TYPE_DETAILS_FAIL,
  TYPE_DETAILS_REQUEST,
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
  TYPE_UPDATE_SUCCESS,
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


export const listAllTypes = () => async (dispatch, getState) => {
  try {
    dispatch({ type: TYPE_LIST_ALL_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get(`/api/types/all`, config);

    dispatch({
      type: TYPE_LIST_ALL_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: TYPE_LIST_ALL_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const listTypeDetails = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: TYPE_DETAILS_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get(`/api/types/${id}`, config);

    dispatch({
      type: TYPE_DETAILS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: TYPE_DETAILS_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const updateType = (type) => async (dispatch, getState) => {
  try {
    dispatch({
      type: TYPE_UPDATE_REQUEST,
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

    const { data } = await axios.put(`/api/types/${type._id}`, type, config);
    dispatch({
      type: TYPE_UPDATE_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: TYPE_UPDATE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const deleteType = (id) => async (dispatch, getState) => {
  try {
    dispatch({
      type: TYPE_DELETE_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    await axios.delete(`/api/types/${id}`, config);
    dispatch({
      type: TYPE_DELETE_SUCCESS,
    });
  } catch (error) {
    dispatch({
      type: TYPE_DELETE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const createType = (type) => async (dispatch, getState) => {
  try {
    dispatch({
      type: TYPE_CREATE_REQUEST,
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

    const { data } = await axios.post(`/api/types/`, type, config);
    dispatch({
      type: TYPE_CREATE_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: TYPE_CREATE_FAIL,
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

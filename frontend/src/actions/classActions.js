import api from '../utils/api';
import {
    CLASS_CREATE_FAIL,
    CLASS_CREATE_REQUEST,
    CLASS_CREATE_SUCCESS,
    CLASS_DELETE_FAIL,
    CLASS_DELETE_REQUEST,
    CLASS_DELETE_SUCCESS,
    CLASS_LIST_FAIL,
    CLASS_LIST_REQUEST,
    CLASS_LIST_SUCCESS,
    CLASS_UPDATE_FAIL,
    CLASS_UPDATE_REQUEST,
    CLASS_UPDATE_SUCCESS
} from '../constants/classConstants';

export const listClasses = () => async dispatch => {
    try {
        dispatch({ type: CLASS_LIST_REQUEST });

        const { data } = await api.get(`/api/classes`);

        dispatch({
            type: CLASS_LIST_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: CLASS_LIST_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const updateClass = standard => async (dispatch, getState) => {
    try {
        dispatch({
            type: CLASS_UPDATE_REQUEST
        });

        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        const { data } = await api.put(`/api/classes/${standard._id}`, standard, config);
        dispatch({
            type: CLASS_UPDATE_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: CLASS_UPDATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const deleteClass = id => async (dispatch, getState) => {
    try {
        dispatch({
            type: CLASS_DELETE_REQUEST
        });

        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        await api.delete(`/api/classes/${id}`, config);
        dispatch({
            type: CLASS_DELETE_SUCCESS
        });
    } catch (error) {
        dispatch({
            type: CLASS_DELETE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const createClass = standard => async (dispatch, getState) => {
    try {
        dispatch({
            type: CLASS_CREATE_REQUEST
        });

        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        const { data } = await api.post(`/api/classes/`, standard, config);
        dispatch({
            type: CLASS_CREATE_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: CLASS_CREATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

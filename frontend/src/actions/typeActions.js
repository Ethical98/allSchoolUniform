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
    TYPE_GET_IMAGES_FAIL,
    TYPE_GET_IMAGES_REQUEST,
    TYPE_GET_IMAGES_SUCCESS,
    TYPE_IMAGE_LIST_FAIL,
    TYPE_IMAGE_LIST_REQUEST,
    TYPE_IMAGE_LIST_SUCCESS,
    TYPE_IMAGE_ONE_UPLOAD_SUCCESS,
    TYPE_IMAGE_TWO_UPLOAD_SUCCESS,
    TYPE_IMAGE_THREE_UPLOAD_SUCCESS,
    TYPE_IMAGE_UPLOAD_FAIL,
    TYPE_IMAGE_UPLOAD_PROGRESS,
    TYPE_IMAGE_UPLOAD_REQUEST,
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
    TYPE_UPDATE_SUCCESS
} from '../constants/typeConstants';

export const listTypes = () => async (dispatch, getState) => {
    try {
        dispatch({ type: TYPE_LIST_REQUEST });

        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        const { data } = await axios.get(`/api/types`, config);

        dispatch({
            type: TYPE_LIST_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: TYPE_LIST_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const listAllTypes = () => async (dispatch, getState) => {
    try {
        dispatch({ type: TYPE_LIST_ALL_REQUEST });

        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        const { data } = await axios.get(`/api/types/all`, config);

        dispatch({
            type: TYPE_LIST_ALL_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: TYPE_LIST_ALL_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const getTypeImages = type => async dispatch => {
    try {
        dispatch({ type: TYPE_GET_IMAGES_REQUEST });

        const { data } = await axios.get(`/api/types/${type}/images`);

        dispatch({
            type: TYPE_GET_IMAGES_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: TYPE_GET_IMAGES_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const listTypeDetails = id => async (dispatch, getState) => {
    try {
        dispatch({ type: TYPE_DETAILS_REQUEST });

        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        const { data } = await axios.get(`/api/types/${id}`, config);

        dispatch({
            type: TYPE_DETAILS_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: TYPE_DETAILS_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const updateType = type => async (dispatch, getState) => {
    try {
        dispatch({
            type: TYPE_UPDATE_REQUEST
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

        const { data } = await axios.put(`/api/types/${type._id}`, type, config);
        dispatch({
            type: TYPE_UPDATE_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: TYPE_UPDATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const deleteType = id => async (dispatch, getState) => {
    try {
        dispatch({
            type: TYPE_DELETE_REQUEST
        });

        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        await axios.delete(`/api/types/${id}`, config);
        dispatch({
            type: TYPE_DELETE_SUCCESS
        });
    } catch (error) {
        dispatch({
            type: TYPE_DELETE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const createType = type => async (dispatch, getState) => {
    try {
        dispatch({
            type: TYPE_CREATE_REQUEST
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

        const { data } = await axios.post(`/api/types/`, type, config);
        dispatch({
            type: TYPE_CREATE_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: TYPE_CREATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const listTypeSizes = type => async (dispatch, getState) => {
    try {
        dispatch({ type: TYPE_SIZES_LIST_REQUEST });

        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        const { data } = await axios.get(`/api/types/${type}/sizes`, config);

        dispatch({
            type: TYPE_SIZES_LIST_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: TYPE_SIZES_LIST_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const listTypeImages =
    (pageNumber = '') =>
        async dispatch => {
            try {
                const config = {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                dispatch({ type: TYPE_IMAGE_LIST_REQUEST });
                const {
                    data: { images: typeImages, pages: typeImagePages }
                } = await axios.get(`/api/types/images?page=${pageNumber}`, config);

                dispatch({
                    type: TYPE_IMAGE_LIST_SUCCESS,
                    payload: { typeImages, typeImagePages }
                });
            } catch (error) {
                dispatch({
                    type: TYPE_IMAGE_LIST_FAIL,
                    payload: error.response && error.response.data.message ? error.response.data.message : error.message
                });
            }
        };

export const uploadTypeImage = (file, imageOne, imageTwo, imageThree) => async dispatch => {
    const baseUrl = '/api/types/images';

    try {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            },
            onUploadProgress: ({ total, loaded }) => {
                const percentage = (loaded / total) * 100;
                dispatch({
                    type: TYPE_IMAGE_UPLOAD_PROGRESS,
                    progress: percentage
                });
            }
        };
        const formData = new FormData();
        formData.append('image', file);

        dispatch({ type: TYPE_IMAGE_UPLOAD_REQUEST });

        const { data } = await axios.post(baseUrl, formData, config);

        if (imageOne) {
            dispatch({
                type: TYPE_IMAGE_ONE_UPLOAD_SUCCESS,
                payload: data
            });
        } else if (imageTwo) {
            dispatch({
                type: TYPE_IMAGE_TWO_UPLOAD_SUCCESS,
                payload: data
            });
        } else {
            dispatch({
                type: TYPE_IMAGE_THREE_UPLOAD_SUCCESS,
                payload: data
            });
        }
    } catch (error) {
        dispatch({
            type: TYPE_IMAGE_UPLOAD_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

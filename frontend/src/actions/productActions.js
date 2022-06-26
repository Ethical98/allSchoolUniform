import {
    PRODUCT_LIST_REQUEST,
    PRODUCT_LIST_SUCCESS,
    PRODUCT_LIST_FAIL,
    PRODUCT_DETAILS_FAIL,
    PRODUCT_DETAILS_SUCCESS,
    PRODUCT_DETAILS_REQUEST,
    PRODUCT_DELETE_REQUEST,
    PRODUCT_DELETE_SUCCESS,
    PRODUCT_DELETE_FAIL,
    PRODUCT_CREATE_REQUEST,
    PRODUCT_CREATE_FAIL,
    PRODUCT_CREATE_SUCCESS,
    PRODUCT_UPDATE_REQUEST,
    PRODUCT_UPDATE_SUCCESS,
    PRODUCT_UPDATE_FAIL,
    PRODUCT_CREATE_REVIEW_FAIL,
    PRODUCT_CREATE_REVIEW_SUCCESS,
    PRODUCT_CREATE_REVIEW_REQUEST,
    PRODUCT_IMAGE_LIST_FAIL,
    PRODUCT_IMAGE_LIST_REQUEST,
    PRODUCT_IMAGE_LIST_SUCCESS,
    PRODUCT_IMAGE_UPLOAD_FAIL,
    PRODUCT_IMAGE_UPLOAD_REQUEST,
    PRODUCT_IMAGE_UPLOAD_SUCCESS,
    PRODUCT_IMAGE_UPLOAD_PROGRESS
} from '../constants/productConstants';

import axios from 'axios';

export const listProducts =
    (keyword = '', pageNumber = '', category = '', season = '', standard = '', school = '') =>
        async dispatch => {
            try {
                dispatch({ type: PRODUCT_LIST_REQUEST });

                const { data } = await axios.get(
                `/api/products?category=${category}&season=${season}&standard=${standard}&keyword=${keyword}&school=${school}&pageNumber=${pageNumber}`
                );

                dispatch({
                    type: PRODUCT_LIST_SUCCESS,
                    payload: data
                });
            } catch (error) {
                dispatch({
                    type: PRODUCT_LIST_FAIL,
                    payload: error.response && error.response.data.message ? error.response.data.message : error.message
                });
            }
        };

export const listProductDetails = name => async dispatch => {
    try {
        dispatch({ type: PRODUCT_DETAILS_REQUEST });

        const { data } = await axios.get(`/api/products/name/${name}`);

        dispatch({
            type: PRODUCT_DETAILS_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: PRODUCT_DETAILS_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const listProductDetailsById = id => async dispatch => {
    try {
        dispatch({ type: PRODUCT_DETAILS_REQUEST });

        const { data } = await axios.get(`/api/products/${id}`);

        dispatch({
            type: PRODUCT_DETAILS_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: PRODUCT_DETAILS_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const filterProducts = (category, season, standard) => async dispatch => {
    try {
        dispatch({ type: PRODUCT_LIST_REQUEST });

        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (category && season && standard) {
            const { data } = await axios.post('/api/products/filter/', { category, season, standard }, config);
            dispatch({
                type: PRODUCT_LIST_SUCCESS,
                payload: data
            });
        } else if (category && season) {
            const { data } = await axios.post('/api/products/filter/', { category, season }, config);
            dispatch({
                type: PRODUCT_LIST_SUCCESS,
                payload: data
            });
        } else if (category && standard) {
            const { data } = await axios.post('/api/products/filter/', { category, standard }, config);
            dispatch({
                type: PRODUCT_LIST_SUCCESS,
                payload: data
            });
        } else if (season && standard) {
            const { data } = await axios.post('/api/products/filter/', { season, standard }, config);
            dispatch({
                type: PRODUCT_LIST_SUCCESS,
                payload: data
            });
        } else if (season) {
            const { data } = await axios.post('/api/products/filter/', { season }, config);
            dispatch({
                type: PRODUCT_LIST_SUCCESS,
                payload: data
            });
        } else if (category) {
            const { data } = await axios.post('/api/products/filter/', { category }, config);
            dispatch({
                type: PRODUCT_LIST_SUCCESS,
                payload: data
            });
        } else if (standard) {
            const { data } = await axios.post('/api/products/filter/', { standard }, config);
            dispatch({
                type: PRODUCT_LIST_SUCCESS,
                payload: data
            });
        } else {
            const { data } = await axios.get('/api/products/filter/');
            dispatch({
                type: PRODUCT_LIST_SUCCESS,
                payload: data
            });
        }
        // Const data = category + season + standard;
        // Dispatch({
        //   Type: PRODUCT_LIST_SUCCESS,
        //   Payload: data,
        // });
    } catch (error) {
        dispatch({
            type: PRODUCT_LIST_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const deleteProduct = id => async (dispatch, getState) => {
    try {
        dispatch({
            type: PRODUCT_DELETE_REQUEST
        });

        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        await axios.delete(`/api/products/${id}`, config);
        dispatch({
            type: PRODUCT_DELETE_SUCCESS
        });
    } catch (error) {
        dispatch({
            type: PRODUCT_DELETE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const createProduct = product => async (dispatch, getState) => {
    try {
        dispatch({
            type: PRODUCT_CREATE_REQUEST
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

        const { data } = await axios.post(`/api/products/`, product, config);
        dispatch({
            type: PRODUCT_CREATE_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: PRODUCT_CREATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const updateProduct = product => async (dispatch, getState) => {
    try {
        dispatch({
            type: PRODUCT_UPDATE_REQUEST
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

        const { data } = await axios.put(`/api/products/${product._id}`, product, config);
        dispatch({
            type: PRODUCT_UPDATE_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: PRODUCT_UPDATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const createProductReview = (productId, review) => async (dispatch, getState) => {
    try {
        dispatch({
            type: PRODUCT_CREATE_REVIEW_REQUEST
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

        await axios.post(`/api/products/${productId}/reviews`, review, config);
        dispatch({
            type: PRODUCT_CREATE_REVIEW_SUCCESS
        });
    } catch (error) {
        dispatch({
            type: PRODUCT_CREATE_REVIEW_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const listProductImages =
    (pageNumber = '') =>
        async dispatch => {
            try {
                const config = {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                dispatch({ type: PRODUCT_IMAGE_LIST_REQUEST });
                const {
                    data: { images: productImages, pages: productImagePages }
                } = await axios.get(`/api/products/images?page=${pageNumber}`, config);

                dispatch({
                    type: PRODUCT_IMAGE_LIST_SUCCESS,
                    payload: { productImages, productImagePages }
                });
            } catch (error) {
                dispatch({
                    type: PRODUCT_IMAGE_LIST_FAIL,
                    payload: error.response && error.response.data.message ? error.response.data.message : error.message
                });
            }
        };

export const uploadProductImage = file => async dispatch => {
    const baseUrl = '/api/products/images';

    try {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            },
            onUploadProgress: ({ total, loaded }) => {
                const percentage = (loaded / total) * 100;
                dispatch({
                    type: PRODUCT_IMAGE_UPLOAD_PROGRESS,
                    progress: percentage
                });
            }
        };
        const formData = new FormData();
        formData.append('image', file);

        dispatch({ type: PRODUCT_IMAGE_UPLOAD_REQUEST });

        const { data } = await axios.post(baseUrl, formData, config);

        dispatch({
            type: PRODUCT_IMAGE_UPLOAD_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: PRODUCT_IMAGE_UPLOAD_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

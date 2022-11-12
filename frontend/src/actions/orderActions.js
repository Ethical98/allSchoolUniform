import {
    ORDER_CREATE_FAIL,
    ORDER_CREATE_SUCCESS,
    ORDER_CREATE_REQUEST,
    ORDER_DETAILS_REQUEST,
    ORDER_DETAILS_SUCCESS,
    ORDER_DETAILS_FAIL,
    ORDER_PAY_SUCCESS,
    ORDER_PAY_FAIL,
    ORDER_PAY_REQUEST,
    ORDER_LIST_MY_REQUEST,
    ORDER_LIST_MY_SUCCESS,
    ORDER_LIST_MY_FAIL,
    ORDER_LIST_FAIL,
    ORDER_LIST_SUCCESS,
    ORDER_LIST_REQUEST,
    ORDER_UPDATE_REQUEST,
    ORDER_UPDATE_SUCCESS,
    ORDER_UPDATE_FAIL,
    ORDER_DELIVER_REQUEST,
    ORDER_DELIVER_SUCCESS,
    ORDER_DELIVER_FAIL,
    ORDER_OUT_FOR_DELIVERY_REQUEST,
    ORDER_OUT_FOR_DELIVERY_SUCCESS,
    ORDER_OUT_FOR_DELIVERY_FAIL,
    ORDER_PROCESSING_REQUEST,
    ORDER_PROCESSING_SUCCESS,
    ORDER_PROCESSING_FAIL,
    ORDER_CONFIRM_REQUEST,
    ORDER_CONFIRM_SUCCESS,
    ORDER_CONFIRM_FAIL,
    ORDER_UPDATE_BILLTYPE_REQUEST,
    ORDER_UPDATE_BILLTYPE_SUCCESS,
    ORDER_UPDATE_BILLTYPE_FAIL,
    ORDER_UPDATE_INVOICE_NUMBER_REQUEST,
    ORDER_UPDATE_INVOICE_NUMBER_SUCCESS,
    ORDER_UPDATE_INVOICE_NUMBER_FAIL,
    ORDER_CANCEL_SUCCESS,
    ORDER_CANCEL_FAIL,
    ORDER_CANCEL_REQUEST
} from '../constants/orderConstants';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const createOrder = (order) => async (dispatch, getState) => {
    try {
        dispatch({
            type: ORDER_CREATE_REQUEST
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

        const { data } = await axios.post(`/api/orders`, order, config);
        dispatch({
            type: ORDER_CREATE_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: ORDER_CREATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const getOrderDetails = (id) => async (dispatch, getState) => {
    try {
        dispatch({
            type: ORDER_DETAILS_REQUEST
        });

        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        const { data } = await axios.get(`/api/orders/${id}`, config);

        dispatch({
            type: ORDER_DETAILS_SUCCESS,
            payload: data
        });
        getState().orderCreate.success = false;
    } catch (error) {
        dispatch({
            type: ORDER_DETAILS_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

// export const payOrderPayU = (totalPrice, name, email, mobile) => async (dispatch, getState) => {
//     try {
//         const {
//             userLogin: { userInfo }
//         } = getState();

//         const config = {
//             headers: {
//                 Accept: 'application/json',
//                 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${userInfo.token}`
//             }
//         };
//         const d = new Date();
//         const pd = {
//             key: process.env.REACT_APP_PAYUMONEY_MERCHANT_KEY,
//             txnid: d.getTime().toString(),
//             hash: '',
//             amount: totalPrice,
//             firstname: name,
//             email,
//             phone: mobile,
//             productinfo: 'SchoolProducts',
//             udf5: 'ALLSCHOOLUNIFORM',
//             surl: 'http://localhost:3000/order',
//             furl: 'http://localhost:3000/paymentfailed'
//         };

//         const detail = {
//             txnid: pd.txnid,
//             email: pd.email,
//             amount: pd.amount,
//             productinfo: pd.productinfo,
//             firstname: pd.firstname,
//             udf5: pd.udf5
//         };
//         const { data } = await axios.post('/api/pay/payment/payumoney', detail, config);

//         pd.hash = data.hash;

//         dispatch({
//             type: ORDER_PAY_REQUEST,
//             payload: pd
//         });
//         window.bolt.launch(
//             pd,

//             {
//                 responseHandler: async (response) => {
//                     dispatch(paymentStatus(response.response));
//                 },
//                 catchException(response) {
//                     dispatch({
//                         type: ORDER_PAY_FAIL,
//                         payload: response
//                     });
//                 }
//             }
//         );
//     } catch (error) {
//         dispatch({
//             type: ORDER_PAY_FAIL,
//             payload: error.response && error.response.data.message ? error.response.data.message : error.message
//         });
//     }
// };
export const launchPaymentPortal = (amount, name, email, mobile) => async (dispatch, getState) => {
    try {
        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        const { data } = await axios.post('/api/pay/payment', { amount }, config);

        dispatch({
            type: ORDER_PAY_REQUEST,
            payload: data
        });

        var paymentDetails = {
            key: process.env.REACT_APP_RAZORPAY_API_KEY,
            amount: amount,
            currency: 'INR',
            name: 'AllSchoolUniform',
            description: 'School Uniform',
            image: 'https://allschooluniform.com/uploads/asu-top-logo.png',
            order_id: data.order.id,
            handler: function (response) {
                dispatch(paymentStatus(response));
            },
            prefill: {
                name: name,
                email: email,
                contact: mobile
            },
            notes: {
                address: ''
            },
            theme: {
                color: '#3399cc'
            }
        };

        var razorLaunch = new window.Razorpay(paymentDetails);
        razorLaunch.on('payment.failed', function (response) {
            dispatch({
                type: ORDER_PAY_FAIL,
                payload: response
            });
        });

        razorLaunch.open();
    } catch (error) {
        dispatch({
            type: ORDER_PAY_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

const paymentStatus = (response) => async (dispatch, getState) => {
    try {
        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        const { data: success } = await axios.post('/api/pay/payment/verify', { response }, config);

        if (success) {
            dispatch({
                type: ORDER_PAY_SUCCESS,
                payload: { ...response, name: userInfo.name, email: userInfo.email }
            });
        }
    } catch (error) {
        dispatch({
            type: ORDER_PAY_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const updateOrder = (orderId, paymentResult) => async (dispatch, getState) => {
    try {
        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        const { data } = await axios.put(`/api/orders/${orderId}/pay`, { paymentResult }, config);
        dispatch({
            type: ORDER_DETAILS_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: ORDER_DETAILS_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const editOrder = (order) => async (dispatch, getState) => {
    try {
        dispatch({
            type: ORDER_UPDATE_REQUEST
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

        const { data } = await axios.put(`/api/orders/${order.orderId}`, order, config);
        dispatch({
            type: ORDER_UPDATE_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: ORDER_UPDATE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const payOrder = (orderId, paymentResult) => async (dispatch, getState) => {
    try {
        dispatch({
            type: ORDER_PAY_REQUEST
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

        const { data } = await axios.put(`/api/orders/${orderId}/pay`, paymentResult, config);
        dispatch({
            type: ORDER_PAY_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: ORDER_PAY_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const listMyOrders = () => async (dispatch, getState) => {
    try {
        dispatch({
            type: ORDER_LIST_MY_REQUEST
        });

        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        const { data } = await axios.get('/api/orders/myorders', config);
        dispatch({
            type: ORDER_LIST_MY_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: ORDER_LIST_MY_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const listOrders =
    (pageNumber = '', keyword = '', status = '') =>
    async (dispatch, getState) => {
        try {
            dispatch({
                type: ORDER_LIST_REQUEST
            });

            const {
                userLogin: { userInfo }
            } = getState();

            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`
                }
            };
            const { data } = await axios.get(
                `/api/orders?pageNumber=${pageNumber}&&keyword=${keyword}&&status=${status}`,
                config
            );
            dispatch({
                type: ORDER_LIST_SUCCESS,
                payload: data
            });
        } catch (error) {
            dispatch({
                type: ORDER_LIST_FAIL,
                payload: error.response && error.response.data.message ? error.response.data.message : error.message
            });
        }
    };

export const trackOrder = (id) => async (dispatch) => {
    try {
        dispatch({
            type: ORDER_DETAILS_REQUEST
        });
        const { data } = await axios.get(`/api/orders/orderid/${id}`);
        dispatch({
            type: ORDER_DETAILS_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: ORDER_DETAILS_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const deliverOrder = (order) => async (dispatch, getState) => {
    try {
        dispatch({
            type: ORDER_DELIVER_REQUEST
        });

        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        const { data } = await axios.put(`/api/orders/${order._id}/deliver`, {}, config);

        dispatch({
            type: ORDER_DELIVER_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: ORDER_DELIVER_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const outForDeliveryOrder = (order) => async (dispatch, getState) => {
    try {
        dispatch({
            type: ORDER_OUT_FOR_DELIVERY_REQUEST
        });

        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        const { data } = await axios.put(`/api/orders/${order._id}/outfordelivery`, {}, config);

        dispatch({
            type: ORDER_OUT_FOR_DELIVERY_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: ORDER_OUT_FOR_DELIVERY_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const processOrder = (order) => async (dispatch, getState) => {
    try {
        dispatch({
            type: ORDER_PROCESSING_REQUEST
        });

        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        const { data } = await axios.put(`/api/orders/${order._id}/processing`, {}, config);

        dispatch({
            type: ORDER_PROCESSING_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: ORDER_PROCESSING_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const confirmOrder = (order) => async (dispatch, getState) => {
    try {
        dispatch({
            type: ORDER_CONFIRM_REQUEST
        });

        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        const { data } = await axios.put(`/api/orders/${order._id}/confirm`, {}, config);

        dispatch({
            type: ORDER_CONFIRM_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: ORDER_CONFIRM_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const cancelOrder = (order) => async (dispatch, getState) => {
    try {
        dispatch({
            type: ORDER_CANCEL_REQUEST
        });

        const {
            userLogin: { userInfo }
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`
            }
        };

        const { data } = await axios.put(`/api/orders/${order._id}/cancel`, {}, config);

        dispatch({
            type: ORDER_CANCEL_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: ORDER_CANCEL_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const updateOrderBillType = (order, billType) => async (dispatch, getState) => {
    try {
        dispatch({
            type: ORDER_UPDATE_BILLTYPE_REQUEST
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

        const { data } = await axios.put(`/api/orders/${order._id}/billType`, { billType }, config);

        dispatch({
            type: ORDER_UPDATE_BILLTYPE_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: ORDER_UPDATE_BILLTYPE_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

export const incrementAndUpdateInvoiceNumber = (order, modified) => async (dispatch, getState) => {
    try {
        dispatch({
            type: ORDER_UPDATE_INVOICE_NUMBER_REQUEST
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

        const { data } = await axios.put(`/api/orders/${order._id}/incrementinvoicenumber`, { modified }, config);

        dispatch({
            type: ORDER_UPDATE_INVOICE_NUMBER_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: ORDER_UPDATE_INVOICE_NUMBER_FAIL,
            payload: error.response && error.response.data.message ? error.response.data.message : error.message
        });
    }
};

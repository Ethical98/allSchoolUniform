import {
    CART_ADD_ITEM,
    CART_REMOVE_ITEM,
    CART_SAVE_PAYMENT_METHOD,
    CART_SAVE_SHIPPING_ADDRESS,
    CART_GET_FROM_DATABASE,
    CART_ITEM_FAIL,
    CART_RESET_REQUEST,
    CART_RESET_SUCCESS,
    CART_RESET_FAIL,
    CART_GET_SHIPPING_ADDRESS,
    CART_FAIL_SHIPPING_ADDRESS,
    CART_REQUEST_SHIPPING_ADDRESS,
    CART_ITEMS_RESET,
    CART_REQUEST_FROM_DATABASE
} from '../constants/cartConstants';

export const cartReducer = (
    state = {
        cartItems: [],
        shippingAddress: {},
        cartSuccess: false,
        added: false,
        cartId: ''
    },
    action
) => {
    switch (action.type) {
        case CART_REQUEST_FROM_DATABASE:
            return {
                ...state,
                loading: true
            };
        case CART_GET_FROM_DATABASE:
            return {
                ...state,
                cartItems: action.payload,
                cartSuccess: true,
                cartId: action.cartId,
                loading: false
            };
        case CART_ADD_ITEM:
            const item = action.payload;
            const existItem = state.cartItems.find((x) => x._id === item._id);

            if (existItem) {
                return {
                    ...state,
                    added: true,
                    cartItems: state.cartItems.map((x) => (x._id === existItem._id ? item : x))
                };
            }
            return {
                ...state,
                added: true,
                cartItems: [...state.cartItems, item]
            };

        case CART_REMOVE_ITEM:
            return {
                ...state,
                cartItems: state.cartItems.filter((x) => x._id !== action.payload)
            };
        case CART_REQUEST_SHIPPING_ADDRESS:
            return { ...state, loading: true };
        case CART_SAVE_SHIPPING_ADDRESS:
            return { ...state, shippingAddress: action.payload };
        case CART_GET_SHIPPING_ADDRESS:
            return { ...state, loading: false, savedAddress: action.payload };
        case CART_FAIL_SHIPPING_ADDRESS:
            return { loading: false, error: action.payload };
        case CART_SAVE_PAYMENT_METHOD:
            return { ...state, paymentMethod: action.payload };
        case CART_ITEM_FAIL:
            return {
                ...state,
                error: action.payload
            };
        case CART_RESET_REQUEST:
            return { ...state, loading: true };
        case CART_RESET_SUCCESS:
            return {
                loading: false,
                success: true,
                cartItems: [],
                shippingAddress: {}
            };
        case CART_RESET_FAIL:
            return { loading: false, error: action.payload };
        case CART_ITEMS_RESET:
            return {
                cartItems: [],
                shippingAddress: {},
                cartSuccess: false,
                cartId: ''
            };
        default:
            return state;
    }
};

// Export const cartResetReducer = (state = {}, action) => {
//   Switch (action.type) {
//     Case CART_RESET_REQUEST:
//       Return { loading: true };
//     Case CART_RESET_SUCCESS:
//       Return { loading: false, success: true };
//     Case CART_RESET_FAIL:
//       Return { loading: false, error: action.payload };
//     Default:
//       Return state;
//   }
// };

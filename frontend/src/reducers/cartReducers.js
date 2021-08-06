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
} from '../constants/cartConstants';

export const cartReducer = (
  state = {
    cartItems: [],
    shippingAddress: {},
    cartSuccess: false,
    added: false,
    cartId: '',
  },
  action
) => {
  switch (action.type) {
    case CART_GET_FROM_DATABASE:
      return {
        ...state,
        cartItems: action.payload,
        cartSuccess: true,
        cartId: action.cartId,
      };
    case CART_ADD_ITEM:
      const item = action.payload;
      const existItem = state.cartItems.find((x) => x._id === item._id);

      if (existItem) {
        return {
          ...state,
          added: true,
          cartItems: state.cartItems.map((x) =>
            x._id === existItem._id ? item : x
          ),
        };
      } else {
        return {
          ...state,
          added: true,
          cartItems: [...state.cartItems, item],
        };
      }

    case CART_REMOVE_ITEM:
      return {
        ...state,
        cartItems: state.cartItems.filter((x) => x._id !== action.payload),
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
        error: action.payload,
      };
    case CART_RESET_REQUEST:
      return { ...state, loading: true };
    case CART_RESET_SUCCESS:
      return {
        loading: false,
        success: true,
        cartItems: [],
        shippingAddress: {},
      };
    case CART_RESET_FAIL:
      return { loading: false, error: action.payload };
    case CART_ITEMS_RESET:
      return {
        cartItems: [],
        shippingAddress: {},
        cartSuccess: false,
        cartId: '',
      };
    default:
      return state;
  }
};

// export const cartResetReducer = (state = {}, action) => {
//   switch (action.type) {
//     case CART_RESET_REQUEST:
//       return { loading: true };
//     case CART_RESET_SUCCESS:
//       return { loading: false, success: true };
//     case CART_RESET_FAIL:
//       return { loading: false, error: action.payload };
//     default:
//       return state;
//   }
// };

import {
  CAROUSEL_IMAGES_FAIL,
  CAROUSEL_IMAGES_REQUEST,
  CAROUSEL_IMAGES_SUCCESS,
} from '../constants/homeConstants';

export const carouselImageListReducer = (
  state = { carouselImages: [] },
  action
) => {
  switch (action.type) {
    case CAROUSEL_IMAGES_REQUEST:
      return { loading: true, carouselImages: [] };
    case CAROUSEL_IMAGES_SUCCESS:
      return { loading: false, carouselImages: action.payload };
    case CAROUSEL_IMAGES_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

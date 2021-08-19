import axios from 'axios';
import {
  CAROUSEL_IMAGES_FAIL,
  CAROUSEL_IMAGES_REQUEST,
  CAROUSEL_IMAGES_SUCCESS,
} from '../constants/homeConstants';

export const listCarouselImages = () => async (dispatch) => {
  try {
    dispatch({ type: CAROUSEL_IMAGES_REQUEST });

    const { data } = await axios.get('/api/home/carousel');
   

    dispatch({
      type: CAROUSEL_IMAGES_SUCCESS,
      payload: data.homePageCarousel,
    });
  } catch (error) {
    dispatch({
      type: CAROUSEL_IMAGES_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

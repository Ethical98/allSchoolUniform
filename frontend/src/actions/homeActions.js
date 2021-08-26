import axios from 'axios';
import {
  CAROUSEL_IMAGES_ADD_FAIL,
  CAROUSEL_IMAGES_ADD_REQUEST,
  CAROUSEL_IMAGES_ADD_SUCCESS,
  CAROUSEL_IMAGES_DELETE_FAIL,
  CAROUSEL_IMAGES_DELETE_REQUEST,
  CAROUSEL_IMAGES_DELETE_SUCCESS,
  CAROUSEL_IMAGES_FAIL,
  CAROUSEL_IMAGES_REQUEST,
  CAROUSEL_IMAGES_SUCCESS,
  CAROUSEL_IMAGES_UPDATE_FAIL,
  CAROUSEL_IMAGES_UPDATE_REQUEST,
  CAROUSEL_IMAGES_UPDATE_SUCCESS,
  STATISTICS_DETAILS_REQUEST,
  STATISTICS_DETAILS_SUCCESS,
  STATISTICS_DETAILS_FAIL,
  STATISTICS_UPDATE_REQUEST,
  STATISTICS_UPDATE_SUCCESS,
  STATISTICS_UPDATE_FAIL,
  HEADER_BG_DETAILS_REQUEST,
  HEADER_BG_DETAILS_SUCCESS,
  HEADER_BG_DETAILS_FAIL,
  HEADER_BG_UPDATE_SUCCESS,
  HEADER_BG_UPDATE_FAIL,
  HEADER_BG_UPDATE_REQUEST,
  ANNOUNCEMENT_LIST_REQUEST,
  ANNOUNCEMENT_LIST_SUCCESS,
  ANNOUNCEMENT_LIST_FAIL,
  ANNOUNCEMENT_UPDATE_REQUEST,
  ANNOUNCEMENT_UPDATE_SUCCESS,
  ANNOUNCEMENT_UPDATE_FAIL,
  ANNOUNCEMENT_DELETE_REQUEST,
  ANNOUNCEMENT_DELETE_SUCCESS,
  ANNOUNCEMENT_DELETE_FAIL,
  ANNOUNCEMENT_ADD_REQUEST,
  ANNOUNCEMENT_ADD_SUCCESS,
  ANNOUNCEMENT_ADD_FAIL,
} from '../constants/homeConstants';

export const listCarouselImages = () => async (dispatch) => {
  try {
    dispatch({ type: CAROUSEL_IMAGES_REQUEST });

    const { data } = await axios.get('/api/home/carousel');
    console.log(data);
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

export const updateCarouselImages = (newData) => async (dispatch, getState) => {
  try {
    dispatch({
      type: CAROUSEL_IMAGES_UPDATE_REQUEST,
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

    const { data } = await axios.put(`/api/home/carousel`, { newData }, config);
    dispatch({
      type: CAROUSEL_IMAGES_UPDATE_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: CAROUSEL_IMAGES_UPDATE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const deleteCarouselImages = (id) => async (dispatch, getState) => {
  try {
    dispatch({
      type: CAROUSEL_IMAGES_DELETE_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    console.log(id);
    await axios.delete(`/api/home/carousel/${id}`, config);
    dispatch({
      type: CAROUSEL_IMAGES_DELETE_SUCCESS,
    });
  } catch (error) {
    dispatch({
      type: CAROUSEL_IMAGES_DELETE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const addCarouselImages = (newData) => async (dispatch, getState) => {
  try {
    dispatch({
      type: CAROUSEL_IMAGES_ADD_REQUEST,
    });
    console.log(newData);
    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.post(`/api/home/carousel`, newData, config);
    dispatch({
      type: CAROUSEL_IMAGES_ADD_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: CAROUSEL_IMAGES_ADD_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const getStatisticsDetails = () => async (dispatch) => {
  try {
    dispatch({ type: STATISTICS_DETAILS_REQUEST });

    const { data } = await axios.get('/api/home/statistics');

    dispatch({
      type: STATISTICS_DETAILS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: STATISTICS_DETAILS_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const updateStatistics = (newData) => async (dispatch, getState) => {
  try {
    dispatch({
      type: STATISTICS_UPDATE_REQUEST,
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
    console.log(newData);
    await axios.put(`/api/home/statistics`, { newData }, config);
    dispatch({
      type: STATISTICS_UPDATE_SUCCESS,
    });
  } catch (error) {
    dispatch({
      type: STATISTICS_UPDATE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const getHeaderBackgroundDetails = () => async (dispatch) => {
  try {
    dispatch({ type: HEADER_BG_DETAILS_REQUEST });

    const { data } = await axios.get('/api/home/header');

    dispatch({
      type: HEADER_BG_DETAILS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: HEADER_BG_DETAILS_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const updateHeaderBackground =
  (newData) => async (dispatch, getState) => {
    try {
      dispatch({
        type: HEADER_BG_UPDATE_REQUEST,
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

      await axios.put(`/api/home/header`, { newData }, config);
      dispatch({
        type: HEADER_BG_UPDATE_SUCCESS,
      });
    } catch (error) {
      dispatch({
        type: HEADER_BG_UPDATE_FAIL,
        payload:
          error.response && error.response.data.message
            ? error.response.data.message
            : error.message,
      });
    }
  };

export const listAnnouncements = () => async (dispatch) => {
  try {
    dispatch({ type: ANNOUNCEMENT_LIST_REQUEST });

    const { data } = await axios.get('/api/home/announcement');
    console.log(data);

    dispatch({
      type: ANNOUNCEMENT_LIST_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ANNOUNCEMENT_LIST_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const updateAnnouncement = (newData) => async (dispatch, getState) => {
  try {
    dispatch({
      type: ANNOUNCEMENT_UPDATE_REQUEST,
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
      `/api/home/announcement`,
      { newData },
      config
    );
    dispatch({
      type: ANNOUNCEMENT_UPDATE_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ANNOUNCEMENT_UPDATE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const deleteAnnouncement = (id) => async (dispatch, getState) => {
  try {
    dispatch({
      type: ANNOUNCEMENT_DELETE_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    console.log(id);
    await axios.delete(`/api/home/announcement/${id}`, config);
    dispatch({
      type: ANNOUNCEMENT_DELETE_SUCCESS,
    });
  } catch (error) {
    dispatch({
      type: ANNOUNCEMENT_DELETE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const addAnnouncement = (newData) => async (dispatch, getState) => {
  try {
    dispatch({
      type: ANNOUNCEMENT_ADD_REQUEST,
    });
    console.log(newData);
    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.post(
      `/api/home/announcement`,
      newData,
      config
    );
    dispatch({
      type: ANNOUNCEMENT_ADD_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ANNOUNCEMENT_ADD_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

import {
  ANNOUNCEMENT_ADD_FAIL,
  ANNOUNCEMENT_ADD_REQUEST,
  ANNOUNCEMENT_ADD_RESET,
  ANNOUNCEMENT_ADD_SUCCESS,
  ANNOUNCEMENT_DELETE_FAIL,
  ANNOUNCEMENT_DELETE_REQUEST,
  ANNOUNCEMENT_DELETE_SUCCESS,
  ANNOUNCEMENT_LIST_FAIL,
  ANNOUNCEMENT_LIST_REQUEST,
  ANNOUNCEMENT_LIST_SUCCESS,
  ANNOUNCEMENT_UPDATE_FAIL,
  ANNOUNCEMENT_UPDATE_REQUEST,
  ANNOUNCEMENT_UPDATE_RESET,
  ANNOUNCEMENT_UPDATE_SUCCESS,
  CAROUSEL_IMAGES_ADD_FAIL,
  CAROUSEL_IMAGES_ADD_REQUEST,
  CAROUSEL_IMAGES_ADD_RESET,
  CAROUSEL_IMAGES_ADD_SUCCESS,
  CAROUSEL_IMAGES_DELETE_FAIL,
  CAROUSEL_IMAGES_DELETE_REQUEST,
  CAROUSEL_IMAGES_DELETE_SUCCESS,
  CAROUSEL_IMAGES_FAIL,
  CAROUSEL_IMAGES_REQUEST,
  CAROUSEL_IMAGES_SUCCESS,
  CAROUSEL_IMAGES_UPDATE_FAIL,
  CAROUSEL_IMAGES_UPDATE_REQUEST,
  CAROUSEL_IMAGES_UPDATE_RESET,
  CAROUSEL_IMAGES_UPDATE_SUCCESS,
  HEADER_BG_DETAILS_FAIL,
  HEADER_BG_DETAILS_REQUEST,
  HEADER_BG_DETAILS_SUCCESS,
  HEADER_BG_UPDATE_FAIL,
  HEADER_BG_UPDATE_REQUEST,
  HEADER_BG_UPDATE_RESET,
  HEADER_BG_UPDATE_SUCCESS,
  STATISTICS_DETAILS_FAIL,
  STATISTICS_DETAILS_REQUEST,
  STATISTICS_DETAILS_SUCCESS,
  STATISTICS_UPDATE_FAIL,
  STATISTICS_UPDATE_REQUEST,
  STATISTICS_UPDATE_RESET,
  STATISTICS_UPDATE_SUCCESS,
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

export const carouselImageUpdateReducer = (state = {}, action) => {
  switch (action.type) {
    case CAROUSEL_IMAGES_UPDATE_REQUEST:
      return { loading: true };
    case CAROUSEL_IMAGES_UPDATE_SUCCESS:
      return { loading: false, success: true, carouselImages: action.payload };
    case CAROUSEL_IMAGES_UPDATE_FAIL:
      return { loading: false, error: action.payload };
    case CAROUSEL_IMAGES_UPDATE_RESET:
      return { carouselImages: [] };
    default:
      return state;
  }
};

export const carouselImageAddReducer = (state = {}, action) => {
  switch (action.type) {
    case CAROUSEL_IMAGES_ADD_REQUEST:
      return { loading: true };
    case CAROUSEL_IMAGES_ADD_SUCCESS:
      return { loading: false, success: true, carouselImages: action.payload };
    case CAROUSEL_IMAGES_ADD_FAIL:
      return { loading: false, error: action.payload };
    case CAROUSEL_IMAGES_ADD_RESET:
      return {};
    default:
      return state;
  }
};

export const carouselImageDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case CAROUSEL_IMAGES_DELETE_REQUEST:
      return { loading: true };
    case CAROUSEL_IMAGES_DELETE_SUCCESS:
      return { loading: false, success: true };
    case CAROUSEL_IMAGES_DELETE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const statisticsDetailsReducer = (state = { stats: [] }, action) => {
  switch (action.type) {
    case STATISTICS_DETAILS_REQUEST:
      return { loading: true, stats: [] };
    case STATISTICS_DETAILS_SUCCESS:
      return { loading: false, stats: action.payload };
    case STATISTICS_DETAILS_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const statisticsUpdateReducer = (state = {}, action) => {
  switch (action.type) {
    case STATISTICS_UPDATE_REQUEST:
      return { loading: true };
    case STATISTICS_UPDATE_SUCCESS:
      return { loading: false, success: true };
    case STATISTICS_UPDATE_FAIL:
      return { loading: false, error: action.payload };
    case STATISTICS_UPDATE_RESET:
      return {};
    default:
      return state;
  }
};

export const headerBackgroundDetailsReducer = (
  state = { headerBackground: [] },
  action
) => {
  switch (action.type) {
    case HEADER_BG_DETAILS_REQUEST:
      return { loading: true, headerBackground: [] };
    case HEADER_BG_DETAILS_SUCCESS:
      return { loading: false, headerBackground: action.payload };
    case HEADER_BG_DETAILS_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const headerBackgroundUpdateReducer = (state = {}, action) => {
  switch (action.type) {
    case HEADER_BG_UPDATE_REQUEST:
      return { loading: true };
    case HEADER_BG_UPDATE_SUCCESS:
      return { loading: false, success: true };
    case HEADER_BG_UPDATE_FAIL:
      return { loading: false, error: action.payload };
    case HEADER_BG_UPDATE_RESET:
      return {};
    default:
      return state;
  }
};

export const announcementListReducer = (
  state = { announcements: [] },
  action
) => {
  switch (action.type) {
    case ANNOUNCEMENT_LIST_REQUEST:
      return { loading: true, announcements: [] };
    case ANNOUNCEMENT_LIST_SUCCESS:
      return { loading: false, announcements: action.payload };
    case ANNOUNCEMENT_LIST_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const announcementUpdateReducer = (state = {}, action) => {
  switch (action.type) {
    case ANNOUNCEMENT_UPDATE_REQUEST:
      return { loading: true };
    case ANNOUNCEMENT_UPDATE_SUCCESS:
      return { loading: false, success: true, announcements: action.payload };
    case ANNOUNCEMENT_UPDATE_FAIL:
      return { loading: false, error: action.payload };
    case ANNOUNCEMENT_UPDATE_RESET:
      return { announcements: [] };
    default:
      return state;
  }
};

export const announcementAddReducer = (state = {}, action) => {
  switch (action.type) {
    case ANNOUNCEMENT_ADD_REQUEST:
      return { loading: true };
    case ANNOUNCEMENT_ADD_SUCCESS:
      return { loading: false, success: true, announcements: action.payload };
    case ANNOUNCEMENT_ADD_FAIL:
      return { loading: false, error: action.payload };
    case ANNOUNCEMENT_ADD_RESET:
      return {};
    default:
      return state;
  }
};

export const announcementDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case ANNOUNCEMENT_DELETE_REQUEST:
      return { loading: true };
    case ANNOUNCEMENT_DELETE_SUCCESS:
      return { loading: false, success: true };
    case ANNOUNCEMENT_DELETE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

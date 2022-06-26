import {
    SCHOOL_LIST_REQUEST,
    SCHOOL_LIST_SUCCESS,
    SCHOOL_LIST_FAIL,
    SCHOOL_NAME_LIST_REQUEST,
    SCHOOL_NAME_LIST_SUCCESS,
    SCHOOL_NAME_LIST_FAIL,
    SCHOOL_DETAILS_REQUEST,
    SCHOOL_DETAILS_SUCCESS,
    SCHOOL_DETAILS_FAIL,
    SCHOOL_DETAILS_RESET,
    SCHOOL_DELETE_REQUEST,
    SCHOOL_DELETE_SUCCESS,
    SCHOOL_DELETE_FAIL,
    SCHOOL_CREATE_REQUEST,
    SCHOOL_CREATE_SUCCESS,
    SCHOOL_CREATE_FAIL,
    SCHOOL_CREATE_RESET,
    SCHOOL_UPDATE_REQUEST,
    SCHOOL_UPDATE_SUCCESS,
    SCHOOL_UPDATE_FAIL,
    SCHOOL_UPDATE_RESET,
    SCHOOL_NAME_LIST_RESET,
    SCHOOL_IMAGE_LIST_REQUEST,
    SCHOOL_IMAGE_LIST_SUCCESS,
    SCHOOL_IMAGE_LIST_FAIL,
    SCHOOL_IMAGE_UPLOAD_REQUEST,
    SCHOOL_IMAGE_UPLOAD_PROGRESS,
    SCHOOL_IMAGE_UPLOAD_SUCCESS,
    SCHOOL_IMAGE_UPLOAD_FAIL,
    SCHOOL_IMAGE_UPLOAD_RESET
} from '../constants/schoolConstants';

export const schoolListReducer = (state = { masterSchools: [] }, action) => {
    switch (action.type) {
        case SCHOOL_LIST_REQUEST:
            return { loading: true };
        case SCHOOL_LIST_SUCCESS:
            return {
                loading: false,
                masterSchools: action.payload.schools,
                pages: action.payload.pages,
                page: action.payload.page
            };
        case SCHOOL_LIST_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const schoolNameListReducer = (state = { schoolNames: [] }, action) => {
    switch (action.type) {
        case SCHOOL_NAME_LIST_REQUEST:
            return { loading: true };
        case SCHOOL_NAME_LIST_SUCCESS:
            return { loading: false, schoolNames: action.payload };
        case SCHOOL_NAME_LIST_FAIL:
            return { loading: false, error: action.payload };
        case SCHOOL_NAME_LIST_RESET:
            return { schoolNames: [] };
        default:
            return state;
    }
};

export const schoolDetailsReducer = (state = { school: {} }, action) => {
    switch (action.type) {
        case SCHOOL_DETAILS_REQUEST:
            return { loading: true, ...state };
        case SCHOOL_DETAILS_SUCCESS:
            return { loading: false, school: action.payload };
        case SCHOOL_DETAILS_FAIL:
            return { loading: false, error: action.payload };
        case SCHOOL_DETAILS_RESET:
            return { school: {} };
        default:
            return state;
    }
};

export const schoolDeleteReducer = (state = {}, action) => {
    switch (action.type) {
        case SCHOOL_DELETE_REQUEST:
            return { loading: true };
        case SCHOOL_DELETE_SUCCESS:
            return { loading: false, success: true };
        case SCHOOL_DELETE_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const schoolCreateReducer = (state = {}, action) => {
    switch (action.type) {
        case SCHOOL_CREATE_REQUEST:
            return { loading: true };
        case SCHOOL_CREATE_SUCCESS:
            return { loading: false, success: true, school: action.payload };
        case SCHOOL_CREATE_FAIL:
            return { loading: false, error: action.payload };
        case SCHOOL_CREATE_RESET:
            return {};
        default:
            return state;
    }
};

export const schoolUpdateReducer = (state = { school: {} }, action) => {
    switch (action.type) {
        case SCHOOL_UPDATE_REQUEST:
            return { loading: true };
        case SCHOOL_UPDATE_SUCCESS:
            return { loading: false, success: true, school: action.payload };
        case SCHOOL_UPDATE_FAIL:
            return { loading: false, error: action.payload };
        case SCHOOL_UPDATE_RESET:
            return { school: {} };
        default:
            return state;
    }
};

export const schoolImageListReducer = (state = { schoolImages: [] }, action) => {
    switch (action.type) {
        case SCHOOL_IMAGE_LIST_REQUEST:
            return { loading: true };
        case SCHOOL_IMAGE_LIST_SUCCESS:
            return {
                loading: false,
                schoolImages: action.payload.schoolImages,
                schoolImagePages: action.payload.schoolImagePages
            };
        case SCHOOL_IMAGE_LIST_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const schoolImageUploadReducer = (state = {}, action) => {
    switch (action.type) {
        case SCHOOL_IMAGE_UPLOAD_REQUEST:
            return { loading: true };

        case SCHOOL_IMAGE_UPLOAD_PROGRESS:
            return { progress: action.progress };
        case SCHOOL_IMAGE_UPLOAD_SUCCESS:
            return {
                loading: false,
                url: action.payload
            };
        case SCHOOL_IMAGE_UPLOAD_FAIL:
            return { loading: false, error: action.payload };
        case SCHOOL_IMAGE_UPLOAD_RESET:
            return { url: '' };
        default:
            return state;
    }
};

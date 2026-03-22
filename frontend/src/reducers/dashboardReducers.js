import {
  ADMIN_DASHBOARD_REQUEST,
  ADMIN_DASHBOARD_SUCCESS,
  ADMIN_DASHBOARD_FAIL,
} from '../constants/dashboardConstants';

export const adminDashboardReducer = (state = { dashboard: {} }, action) => {
  switch (action.type) {
    case ADMIN_DASHBOARD_REQUEST:
      return { ...state, loading: true };
    case ADMIN_DASHBOARD_SUCCESS:
      return { loading: false, dashboard: action.payload };
    case ADMIN_DASHBOARD_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

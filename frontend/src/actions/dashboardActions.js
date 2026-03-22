import {
  ADMIN_DASHBOARD_REQUEST,
  ADMIN_DASHBOARD_SUCCESS,
  ADMIN_DASHBOARD_FAIL,
} from '../constants/dashboardConstants';
import api, { getAuthConfig } from '../utils/api';

export const getAdminDashboard =
  (period = 'month', startDate = '', endDate = '') =>
  async (dispatch, getState) => {
    try {
      dispatch({ type: ADMIN_DASHBOARD_REQUEST });

      const config = getAuthConfig(getState);

      const { data } = await api.get(
        `/api/orders/dashboard?period=${period}&startDate=${startDate}&endDate=${endDate}`,
        config
      );

      dispatch({
        type: ADMIN_DASHBOARD_SUCCESS,
        payload: data,
      });
    } catch (error) {
      dispatch({
        type: ADMIN_DASHBOARD_FAIL,
        payload:
          error.response && error.response.data.message
            ? error.response.data.message
            : error.message,
      });
    }
  };

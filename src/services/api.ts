import axios, { AxiosError, AxiosResponse } from 'axios';
import { JError } from '../types';
import { API_URL } from '../constants';


const requestAPI = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

requestAPI.interceptors.request.use(
  (config) => config,
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

requestAPI.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      window.location.href = "/auth/signin";
      return Promise.reject(error);
    }

    let response: JError;
    if (error.code === 'ERR_NETWORK') {
      response = {
        code: 504,
        message: "Network error. Server is not reachable.",
      };
    } else {
      response = error?.response?.data as JError || {
        code: error.response?.status || 500,
        message: error.message || "An unexpected error occurred.",
      };
    }

    return Promise.reject(response);
  }
);

export default requestAPI;

import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ApiError } from './types';

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token if session exists
axiosClient.interceptors.request.use(
  (config) => {
    try {
      const rawSession = localStorage.getItem('shopsphere.session');
      if (rawSession) {
        const session = JSON.parse(rawSession);
        if (session?.token) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: error normalisation & 401 handling
axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; fieldErrors?: Record<string, string>; error?: string }>) => {
    // Check if network error or no response
    if (!error.response) {
      const normalError: ApiError = {
        status: 0,
        message: "Can't reach the server. Please check that the backend is running and try again.",
      };
      return Promise.reject(normalError);
    }

    const { status, data, config } = error.response;

    // 401 Unauthorized handling (skip for login endpoint itself)
    const isLoginRequest = config.url?.includes('/api/auth/login') && config.method?.toLowerCase() === 'post';
    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem('shopsphere.session');
      toast.error('Your session has expired. Please sign in again.');
      
      const currentPath = window.location.pathname + window.location.search;
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
      }

      const normalError: ApiError = {
        status: 401,
        message: 'Your session has expired. Please sign in again.',
      };
      return Promise.reject(normalError);
    }

    let message = data?.message || 'An unexpected error occurred';
    if (!data?.message) {
      if (status === 403) {
        message = "You don't have permission to do that.";
      } else if (status === 500) {
        message = 'Something went wrong on our side. Please try again.';
      }
    }
    if (status === 401 && isLoginRequest) {
      message = 'Invalid email or password';
    }

    const normalError: ApiError = {
      status,
      message,
      fieldErrors: data?.fieldErrors,
    };

    return Promise.reject(normalError);
  }
);

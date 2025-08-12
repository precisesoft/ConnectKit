import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@store/authStore';
import { ApiResponse, ApiException } from './types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Create axios instance with default configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: false, // Set to true if using cookies for auth
  });

  return client;
};

export const apiClient = createApiClient();

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add authentication token
    const authHeader = useAuthStore.getState().getAuthHeader();
    if (authHeader) {
      config.headers.Authorization = authHeader;
    }

    // Add request timestamp for debugging
    if (__DEV__) {
      config.metadata = { startTime: new Date() };
    }

    // Update last activity
    useAuthStore.getState().updateLastActivity();

    return config;
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common responses and errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response time in development
    if (__DEV__ && response.config.metadata) {
      const endTime = new Date();
      const duration = endTime.getTime() - response.config.metadata.startTime.getTime();
      console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }

    // Transform response to our standard format
    if (response.data && typeof response.data === 'object') {
      return response;
    }

    // Wrap non-standard responses
    return {
      ...response,
      data: {
        success: true,
        data: response.data,
      },
    };
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle network errors
    if (!error.response) {
      const networkError = new ApiException(
        'Network error. Please check your internet connection.',
        0,
        'NETWORK_ERROR'
      );
      return Promise.reject(networkError);
    }

    const { status, data } = error.response;

    // Handle 401 Unauthorized errors
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = useAuthStore.getState().refreshToken;
        if (refreshToken && !useAuthStore.getState().isTokenExpired()) {
          const response = await apiClient.post('/auth/refresh', {
            refreshToken,
          });

          const { token, refreshToken: newRefreshToken } = response.data.data;
          useAuthStore.getState().setTokens(token, newRefreshToken);

          // Retry the original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }

      // Clear auth state and redirect to login
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }

    // Handle 403 Forbidden errors
    if (status === 403) {
      const forbiddenError = new ApiException(
        'You do not have permission to perform this action.',
        403,
        'FORBIDDEN'
      );
      return Promise.reject(forbiddenError);
    }

    // Handle 404 Not Found errors
    if (status === 404) {
      const notFoundError = new ApiException(
        'The requested resource was not found.',
        404,
        'NOT_FOUND'
      );
      return Promise.reject(notFoundError);
    }

    // Handle 429 Rate Limit errors
    if (status === 429) {
      const rateLimitError = new ApiException(
        'Too many requests. Please try again later.',
        429,
        'RATE_LIMIT'
      );
      return Promise.reject(rateLimitError);
    }

    // Handle 500 Internal Server Error
    if (status >= 500) {
      const serverError = new ApiException(
        'Server error. Please try again later.',
        status,
        'SERVER_ERROR',
        data
      );
      return Promise.reject(serverError);
    }

    // Handle validation errors (400)
    if (status === 400 && data) {
      const validationError = new ApiException(
        data.message || 'Validation failed',
        400,
        'VALIDATION_ERROR',
        data.errors || data.details
      );
      return Promise.reject(validationError);
    }

    // Handle other client errors
    const apiError = new ApiException(
      data?.message || error.message || 'An unexpected error occurred',
      status,
      data?.code || 'UNKNOWN_ERROR',
      data
    );

    return Promise.reject(apiError);
  }
);

// API Helper functions
export class ApiClient {
  // GET request
  static async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.get(url, config);
    return response.data;
  }

  // POST request
  static async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.post(url, data, config);
    return response.data;
  }

  // PUT request
  static async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.put(url, data, config);
    return response.data;
  }

  // PATCH request
  static async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.patch(url, data, config);
    return response.data;
  }

  // DELETE request
  static async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.delete(url, config);
    return response.data;
  }

  // File upload
  static async upload<T = any>(
    url: string,
    file: File,
    onUploadProgress?: (progressEvent: any) => void,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });

    return response.data;
  }

  // Download file
  static async download(
    url: string,
    filename: string,
    config?: AxiosRequestConfig
  ): Promise<void> {
    const response = await apiClient.get(url, {
      ...config,
      responseType: 'blob',
    });

    // Create download link
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
}

// Request cancellation helpers
export const createCancelToken = () => {
  const source = axios.CancelToken.source();
  return source;
};

export const isRequestCanceled = (error: any) => {
  return axios.isCancel(error);
};

// Health check function
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/health', { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

// Retry mechanism for failed requests
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof ApiException && error.status >= 400 && error.status < 500) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
};

export default apiClient;
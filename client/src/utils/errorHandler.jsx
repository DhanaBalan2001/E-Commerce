import React from 'react';
import { toast } from 'react-toastify';

// API Error types
export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Error status code mappings
const ERROR_STATUS_MAPPING = {
  400: ERROR_TYPES.VALIDATION_ERROR,
  401: ERROR_TYPES.AUTHENTICATION_ERROR,
  403: ERROR_TYPES.AUTHORIZATION_ERROR,
  404: ERROR_TYPES.NOT_FOUND_ERROR,
  408: ERROR_TYPES.TIMEOUT_ERROR,
  500: ERROR_TYPES.SERVER_ERROR,
  502: ERROR_TYPES.SERVER_ERROR,
  503: ERROR_TYPES.SERVER_ERROR,
  504: ERROR_TYPES.TIMEOUT_ERROR
};

// Default error messages
const DEFAULT_ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
  [ERROR_TYPES.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ERROR_TYPES.AUTHENTICATION_ERROR]: 'Please login to continue.',
  [ERROR_TYPES.AUTHORIZATION_ERROR]: 'You don\'t have permission to perform this action.',
  [ERROR_TYPES.NOT_FOUND_ERROR]: 'The requested resource was not found.',
  [ERROR_TYPES.SERVER_ERROR]: 'Server error occurred. Please try again later.',
  [ERROR_TYPES.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
  [ERROR_TYPES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
};

// Handle API errors with timeout support
export const handleApiError = (error) => {
  console.error('API Error:', error);

  // Handle timeout errors specifically
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      type: 'TIMEOUT_ERROR',
      message: 'Request is taking longer than expected. Please wait or try again.',
      status: 408,
      data: null,
      shouldRetry: true
    };
  }

  // Network error
  if (!error.response) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Network connection failed. Please check your internet connection.',
      status: null,
      data: null,
      shouldRetry: true
    };
  }

  // HTTP error response
  const { status, data } = error.response;

  switch (status) {
    case 400:
      return {
        type: 'VALIDATION_ERROR',
        message: data?.message || 'Invalid request data',
        status,
        data: data?.errors || null
      };

    case 401:
      return {
        type: 'AUTH_ERROR',
        message: data?.message || 'Authentication required',
        status,
        data: null
      };

    case 403:
      return {
        type: 'PERMISSION_ERROR',
        message: data?.message || 'Access denied',
        status,
        data: null
      };

    case 404:
      return {
        type: 'NOT_FOUND_ERROR',
        message: data?.message || 'Resource not found',
        status,
        data: null
      };

    case 408:
      return {
        type: 'TIMEOUT_ERROR',
        message: 'Request timeout. Server is taking longer to respond.',
        status,
        data: null,
        shouldRetry: true
      };

    case 429:
      return {
        type: 'RATE_LIMIT_ERROR',
        message: data?.message || 'Too many requests. Please try again later.',
        status,
        data: null
      };

    case 500:
    case 502:
    case 503:
    case 504:
      return {
        type: 'SERVER_ERROR',
        message: data?.message || 'Server error. Please try again later.',
        status,
        data: null,
        shouldRetry: true
      };

    default:
      return {
        type: 'UNKNOWN_ERROR',
        message: data?.message || 'An unexpected error occurred',
        status,
        data: data || null
      };
  }
};

export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'An unexpected error occurred';
};

// Show error notification
export const showErrorNotification = (error, customMessage = null) => {
  const message = customMessage || error.message || 'An error occurred';
  
  // Don't show toast for authentication errors if redirecting
  if (error.type === ERROR_TYPES.AUTHENTICATION_ERROR) {
    return;
  }
  
  toast.error(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  });
};

// Show success notification
export const showSuccessNotification = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  });
};

// Show warning notification
export const showWarningNotification = (message) => {
  toast.warning(message, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  });
};

// Retry mechanism for failed requests
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry for client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

// Global error boundary handler
export const handleGlobalError = (error, errorInfo) => {
  console.error('Global Error:', error, errorInfo);
  
  // Log to external service in production
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error tracking service
    // errorTrackingService.captureException(error, { extra: errorInfo });
  }
  
  showErrorNotification({
    message: 'Something went wrong. Please refresh the page and try again.'
  });
};

// Validation error formatter
export const formatValidationErrors = (errors) => {
  if (!errors || !Array.isArray(errors)) return {};
  
  return errors.reduce((acc, error) => {
    const field = error.field || error.path || 'general';
    acc[field] = error.message || error;
    return acc;
  }, {});
};

// Check if error is retryable
export const isRetryableError = (error) => {
  if (!error.response) return true; // Network errors are retryable
  if (error.shouldRetry) return true; // Explicitly marked as retryable
  
  const status = error.response?.status || error.status;
  return status >= 500 || status === 408 || status === 429;
};

// Helper function to determine if error should trigger retry
export const shouldRetryError = (error) => {
  return error?.shouldRetry === true || 
         error?.type === 'NETWORK_ERROR' || 
         error?.type === 'TIMEOUT_ERROR' ||
         (error?.status && error.status >= 500);
};

// Error boundary component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    handleGlobalError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <div className="container text-center py-5">
            <div className="error-icon mb-4">
              <i className="fas fa-exclamation-triangle fa-4x text-warning"></i>
            </div>
            <h2>Oops! Something went wrong</h2>
            <p className="text-muted mb-4">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

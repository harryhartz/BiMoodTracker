// API client with authentication and error handling

interface ApiOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  data?: any;
  params?: Record<string, string>;
}

interface ApiError extends Error {
  status?: number;
  errors?: { path: string; message: string }[];
}

// Get auth token from localStorage
const getAuthToken = () => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    
    const user = JSON.parse(userData);
    return user.token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export async function apiClient<T = any>({ method, path, data, params }: ApiOptions): Promise<T> {
  // Prepare URL with query parameters
  let url = path;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url = `${url}?${queryString}`;
    }
  }

  // Prepare headers with authentication
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Make request
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    // Handle success responses
    if (response.ok) {
      // Handle no content responses
      if (response.status === 204) {
        return {} as T;
      }
      return await response.json();
    }

    // Handle error responses
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || 'An unexpected error occurred') as ApiError;
    error.status = response.status;
    error.errors = errorData.errors;
    
    // Handle specific error types
    if (response.status === 401) {
      // Unauthorized - clear user session if we had one
      if (localStorage.getItem('user')) {
        localStorage.removeItem('user');
        window.location.href = '/auth'; // Redirect to login
      }
    }
    
    throw error;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    
    // Network errors or other unexpected issues
    const networkError = new Error('Network error or server unavailable') as ApiError;
    throw networkError;
  }
}

// Convenience methods
export const api = {
  get: <T = any>(path: string, params?: Record<string, string>) => 
    apiClient<T>({ method: 'GET', path, params }),
  
  post: <T = any>(path: string, data: any) => 
    apiClient<T>({ method: 'POST', path, data }),
  
  put: <T = any>(path: string, data: any) => 
    apiClient<T>({ method: 'PUT', path, data }),
  
  patch: <T = any>(path: string, data: any) => 
    apiClient<T>({ method: 'PATCH', path, data }),
  
  delete: <T = any>(path: string) => 
    apiClient<T>({ method: 'DELETE', path }),
};
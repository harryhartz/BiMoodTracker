import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: any,
  options: { params?: Record<string, string> } = {}
): Promise<T> {
  const { params } = options;

  let fullUrl = url;
  if (params) {
    const searchParams = new URLSearchParams(params);
    fullUrl += `?${searchParams.toString()}`;
  }

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(fullUrl, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  // Ensure arrays are actually arrays
  if (Array.isArray(result)) {
    return result;
  } else if (result && typeof result === 'object') {
    // If it's an object, ensure any array properties are actually arrays
    for (const key in result) {
      if (result[key] === null || result[key] === undefined) {
        // Convert null/undefined to empty arrays for known array fields
        if (key === 'moodTags' || key === 'emotions') {
          result[key] = [];
        }
      }
    }
  }

  return result;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Add auth token if available, just like in apiRequest
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers: headers
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return [];
      }

      if (res.status === 401) {
        // For 401 errors, always return an empty array instead of throwing
        // This prevents the t.slice errors by ensuring consistent return types
        console.warn('Authentication required, returning empty data array');
        return [];
      }

      await throwIfResNotOk(res);
      
      // Ensure we always return an array for collection endpoints to prevent t.slice errors
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        return [data];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error in query function:', error);
      // Return empty array on error to prevent t.slice errors
      return [];
    }
  };

// Create a custom query function that includes auth tokens
const createQueryFn = () => {
  return getQueryFn({ on401: "throw" });
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: createQueryFn(),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

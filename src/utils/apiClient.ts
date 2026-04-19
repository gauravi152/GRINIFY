import { API_BASE_URL } from '../config';

interface RequestOptions extends RequestInit {
    timeout?: number;
    retries?: number;
}

/**
 * Enhanced fetch wrapper with timeout, automatic retry, and standardized error handling.
 * Resolves the "Failed to fetch" issue by providing clearer diagnostics.
 */
export async function apiClient(endpoint: string, options: RequestOptions = {}) {
    const { timeout = 10000, retries = 2, ...fetchOptions } = options;
    
    // Ensure absolute URL
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    if (import.meta.env.DEV) {
        let logBody = '';
        if (fetchOptions.body instanceof FormData) {
            logBody = '[FormData]';
        } else if (typeof fetchOptions.body === 'string') {
            try {
                logBody = JSON.parse(fetchOptions.body);
            } catch (e) {
                logBody = fetchOptions.body;
            }
        }
        console.log(`[API Request] ${fetchOptions.method || 'GET'} ${url}`, logBody);
    }

    let lastError: any;
    
    const token = localStorage.getItem('grinify_token');
    if (token) {
        console.log(`[API Request] Token present for ${endpoint}`);
    } else {
        console.warn(`[API Request] No token found for ${endpoint}`);
    }

    // Safely merge existing headers with the Authorization header
    const headers = new Headers(fetchOptions.headers as any || {});
    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                headers,
                signal: controller.signal,
            });
            
            clearTimeout(id);

            if (import.meta.env.DEV) {
                console.log(`[API Response] ${response.status} ${url}`);
            }

            if (!response.ok) {
                let errorMessage = `API Error: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Ignore JSON parse error if body isn't JSON
                }
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (err: any) {
            clearTimeout(id);
            lastError = err;

            // Handle AbortError specifically (Timeout)
            if (err.name === 'AbortError') {
                lastError = new Error('Server unavailable, please try again');
            } else if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
                // This is the specific error the user wants to harden
                lastError = new Error('Server unavailable, please try again');
            }

            if (attempt < retries) {
                console.warn(`[API] Attempt ${attempt + 1} failed. Retrying...`, lastError.message);
                // Simple exponential backoff or delay could be added here
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }

    if (import.meta.env.DEV) {
        console.error(`[API Failure] ${url}`, lastError.message);
    }
    
    throw lastError;
}

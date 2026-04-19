import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiClient } from '../utils/apiClient';

interface User {
    name: string;
    email: string;
    avatar?: string;
    location?: string;
    points?: number;
    scans?: number;
    rank?: string;
    gender?: string;
    birthdate?: string;
    history?: Array<{ date: string, item: string, points: number }>;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    updateProfile: (data: { name: string, email: string, location?: string, gender?: string, birthdate?: string }) => Promise<void>;
    uploadAvatar: (file: File) => Promise<void>;
    refreshUser: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        const token = localStorage.getItem('grinify_token');
        if (token) {
            try {
                const data = await apiClient('/user/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (data.status === 'success') {
                    setUser(data.user);
                    setIsAuthenticated(true);
                } else {
                    localStorage.removeItem('grinify_token');
                }
            } catch (err) {
                console.error("Auth hydration failed:", err);
                localStorage.removeItem('grinify_token');
            }
        }
    };

    useEffect(() => {
        /**
         * Verifies backend health and hydates auth state from token.
         */
        const initAuth = async () => {
            // Proactive health check logic as requested by user
            try {
                const health = await apiClient('/health', { timeout: 3000 });
                console.log("[Auth] Backend Health Check:", health.status === 'ok' ? 'ONLINE' : 'UNSTABLE');
            } catch (err) {
                console.error("[Auth] Backend Health Check FAILED. The server might be offline.");
            }

            await refreshUser();
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            // Using logic with retries: apiClient handles the "Failed to fetch" conversion
            const data = await apiClient('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                retries: 2 // Automatically retry twice on network failure
            });

            if (data.status === 'success') {
                setUser(data.user);
                setIsAuthenticated(true);
                localStorage.setItem('grinify_token', data.token);
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (err: any) {
            console.error("Login attempt failed:", err.message);
            throw err; // error msg is already mapped to user-friendly version in apiClient
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        try {
            const data = await apiClient('/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            if (data.status === 'success') {
                setUser(data.user);
                setIsAuthenticated(true);
                localStorage.setItem('grinify_token', data.token);
            } else {
                throw new Error(data.message || 'Signup failed');
            }
        } catch (err: any) {
            console.error("Signup attempt failed:", err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('grinify_token');
        localStorage.removeItem('lastScannedCategory');
    };

    const updateProfile = async (data: { name: string, email: string, location?: string, gender?: string, birthdate?: string }) => {
        const token = localStorage.getItem('grinify_token');
        try {
            const result = await apiClient('/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            
            if (result.status === 'success') {
                setUser(result.user);
            } else {
                throw new Error(result.message || 'Update failed');
            }
        } catch (err) {
            console.error("Profile update failed:", err);
            throw err;
        }
    }

    const uploadAvatar = async (file: File) => {
        const token = localStorage.getItem('grinify_token');
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Note: FormData handles its own boundary headers, so don't set Content-Type manually
            const data = await apiClient('/profile/upload-image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (data.status === 'success') {
                setUser(prev => prev ? { ...prev, avatar: data.avatar } : null);
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch (err) {
            console.error("Avatar upload failed:", err);
            throw err;
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout, updateProfile, uploadAvatar, refreshUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

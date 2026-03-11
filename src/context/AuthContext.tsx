import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

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
    isLoading: boolean;
}

const API_BASE_URL = 'http://localhost:8000';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('grinify_token');
            if (token) {
                try {
                    const response = await fetch(`${API_BASE_URL}/user/data`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (!response.ok) throw new Error('Failed to hydrate session');
                    const data = await response.json();
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
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Authentication failed');
            }

            const data = await response.json();
            if (data.status === 'success') {
                setUser(data.user);
                setIsAuthenticated(true);
                localStorage.setItem('grinify_token', data.token);
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (err) {
            console.error("Login failed:", err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Signup failed');
            }

            const data = await response.json();
            if (data.status === 'success') {
                setUser(data.user);
                setIsAuthenticated(true);
                localStorage.setItem('grinify_token', data.token);
            } else {
                throw new Error(data.message || 'Signup failed');
            }
        } catch (err) {
            console.error("Signup failed:", err);
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
            const response = await fetch(`${API_BASE_URL}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update profile');

            const result = await response.json();
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
            const response = await fetch(`${API_BASE_URL}/profile/upload-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
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
        <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout, updateProfile, uploadAvatar, isLoading }}>
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

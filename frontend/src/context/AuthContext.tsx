'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { User, AuthResponse } from '@/types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, location?: { lat: number; lng: number }) => Promise<void>;
    logout: () => void;
    updateLocation: (lat: number, lng: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore session
        const savedToken = localStorage.getItem('sentinel_token');
        const savedUser = localStorage.getItem('sentinel_user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('sentinel_token', data.token);
        localStorage.setItem('sentinel_user', JSON.stringify(data.user));
    };

    const register = async (
        name: string,
        email: string,
        password: string,
        location?: { lat: number; lng: number }
    ) => {
        const { data } = await api.post<AuthResponse>('/auth/register', {
            name,
            email,
            password,
            location,
        });
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('sentinel_token', data.token);
        localStorage.setItem('sentinel_user', JSON.stringify(data.user));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('sentinel_token');
        localStorage.removeItem('sentinel_user');
    };

    const updateLocation = async (lat: number, lng: number) => {
        await api.put('/auth/location', { lat, lng });
        if (user) {
            const updated = { ...user, location: { lat, lng } };
            setUser(updated);
            localStorage.setItem('sentinel_user', JSON.stringify(updated));
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateLocation }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}

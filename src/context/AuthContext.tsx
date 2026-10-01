import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role?: 'ADMIN' | 'MEMBER') => Promise<void>;
  logout: () => void;
  switchUser: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('planify_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    const savedToken = localStorage.getItem('planify_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
    } catch {
      localStorage.removeItem('planify_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await api.login({ email, password });
      localStorage.setItem('planify_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, role?: 'ADMIN' | 'MEMBER') => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await api.signup({ name, email, password, role });
      localStorage.setItem('planify_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const switchUser = async (email: string) => {
    setError(null);
    setIsLoading(true);
    try {
      // In seed data, default password is password123
      const data = await api.login({ email, password: 'password123' });
      localStorage.setItem('planify_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || 'User switch failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('planify_token');
    setToken(null);
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        login,
        signup,
        logout,
        switchUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

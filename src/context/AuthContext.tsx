import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  activeRole: 'brand' | 'creator' | 'admin';
  unreadNotifications: number;
  toasts: ToastItem[];
  login: (email: string, password: string) => Promise<User>;
  registerUser: (payload: any) => Promise<User>;
  logout: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  fetchNotifications: () => Promise<void>;
  refreshSessionUser: () => Promise<void>;
  updateUserProfile: (profileData: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    sessionStorage.getItem('token') || localStorage.getItem('token')
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<'brand' | 'creator' | 'admin'>('creator');
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3400);
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setUnreadNotifications(res.unreadCount || 0);
      }
    } catch (e) {
      // Ignore unauth notification errors
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.user) {
            setUser(res.user);
            setActiveRole(res.user.role);
            fetchNotifications();
          } else {
            logout();
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };

    checkSession();
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.login({ email, password });
    sessionStorage.setItem('token', res.token);
    setToken(res.token);
    setUser(res.user);
    setActiveRole(res.user.role);
    showToast(`Welcome back, ${res.user.profile?.company_name || res.user.profile?.full_name || 'User'}!`);
    fetchNotifications();
    return res.user;
  };

  const registerUser = async (payload: any): Promise<User> => {
    const res = await api.register(payload);
    sessionStorage.setItem('token', res.token);
    setToken(res.token);
    setUser(res.user);
    setActiveRole(res.user.role);
    showToast(`Account created successfully! Welcome to CreatorHub.`);
    return res.user;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setUnreadNotifications(0);
    showToast('Logged out of session.', 'info');
  };

  const refreshSessionUser = async () => {
    if (!token) return;
    try {
      const res = await api.getMe();
      if (res.user) {
        setUser(res.user);
      }
    } catch (e) {
      console.error('Error refreshing session:', e);
    }
  };

  const updateUserProfile = (profileData: any) => {
    setUser(prev => prev ? { ...prev, profile: { ...(prev.profile || {}), ...profileData } } : prev);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        activeRole,
        unreadNotifications,
        toasts,
        login,
        registerUser,
        logout,
        showToast,
        fetchNotifications,
        refreshSessionUser,
        updateUserProfile
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

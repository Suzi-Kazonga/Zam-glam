import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/authApi';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && typeof parsedUser === 'object') setUser(parsedUser);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  // The API client raises this when the server rejects a stored token — expired, or
  // signed with a secret that has since changed. Drop the signed-in state with it, or the
  // header keeps offering a dashboard that no longer loads.
  useEffect(() => {
    const onSessionEnded = () => setUser(null);
    window.addEventListener('zamglam:session-ended', onSessionEnded);
    return () => window.removeEventListener('zamglam:session-ended', onSessionEnded);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const data = await authApi.login(email, password);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.error || err.message);
      throw err;
    }
  };

  const register = async (name, email, password, role = 'customer') => {
    try {
      setError(null);
      const data = await authApi.register(name, email, password, role);
      return data;
    } catch (err) {
      setError(err.error || err.message);
      throw err;
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

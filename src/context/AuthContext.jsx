import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cowork_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up axios interceptor for auth token
    const interceptor = apiClient.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem('cowork_token');
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });

    // Load user from localStorage on mount
    const storedUser = localStorage.getItem('cowork_user');
    if (storedUser && token) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('cowork_user');
        localStorage.removeItem('cowork_token');
      }
    }
    setLoading(false);

    return () => {
      apiClient.interceptors.request.eject(interceptor);
    };
  }, []);

  const login = (userData, accessToken) => {
    setCurrentUser(userData);
    setToken(accessToken);
    localStorage.setItem('cowork_token', accessToken);
    localStorage.setItem('cowork_user', JSON.stringify(userData));
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('cowork_token');
    localStorage.removeItem('cowork_user');
  };

  const userRole = typeof currentUser?.role === 'object' ? currentUser?.role?.name : currentUser?.role;
  const roleUpper = String(userRole || '').toUpperCase();
  const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN';
  const isMember = roleUpper === 'MEMBER' || (!isAdmin && !!currentUser);
  const isAuthenticated = !!currentUser && !!token;

  return (
    <AuthContext.Provider value={{
      currentUser,
      token,
      loading,
      login,
      logout,
      isAdmin,
      isMember,
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthContext;

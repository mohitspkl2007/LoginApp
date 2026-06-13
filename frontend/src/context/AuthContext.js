import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setUser, logout as reduxLogout } from '../redux/slices/authSlice';
import API_URL from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const verifyUserToken = async () => {
      const token = localStorage.getItem('token');
      const storedUserJson = localStorage.getItem('user');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Pre-set user state from localStorage for fast initial render
        if (storedUserJson) {
          const parsed = JSON.parse(storedUserJson);
          setUserState(parsed);
          dispatch(setUser(parsed));
        }

        // Fetch fresh profile details from server
        const res = await axios.get(`${API_URL}/api/user/profile`);
        const freshUser = res.data;

        setUserState(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
        dispatch(setUser(freshUser));
      } catch (err) {
        console.error('Failed to restore auth session:', err.message);
        // Clean up session if verification fails completely
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUserState(null);
        dispatch(reduxLogout());
      } finally {
        setLoading(false);
      }
    };

    verifyUserToken();
  }, [dispatch]);

  const login = (token, refreshToken, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUserState(userData);
    dispatch(setUser(userData));
  };

  const handleLogoutLocal = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUserState(null);
    dispatch(reduxLogout());
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await axios.post(`${API_URL}/api/auth/logout`, { refreshToken });
      }
    } catch (err) {
      console.warn('Backend logout call failed:', err.message);
    } finally {
      handleLogoutLocal();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;

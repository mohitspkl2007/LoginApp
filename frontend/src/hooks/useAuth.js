import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

import API_URL from '../config/api';

const useAuth = () => {
  const { user, loading, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getToken = () => localStorage.getItem('token');

  const isAdmin = user?.role === 'admin';
  const isHR = user?.role === 'hr';
  const isManager = user?.role === 'manager';
  const canApprove = isAdmin || isHR || isManager;

  return {
    user,
    loading,
    handleLogout,
    getToken,
    isAdmin,
    isHR,
    isManager,
    canApprove,
    API_URL
  };
};

export default useAuth;
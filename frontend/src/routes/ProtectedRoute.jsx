import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

function ProtectedRoute({ children, requiredRoles }) {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '4px solid rgba(255,255,255,0.05)',
          borderTop: '4px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace state={{ accessDenied: true }} />;
  }

  return children;
}

export default ProtectedRoute;
import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../theme/ThemeContext';
import GlobalSearch from "../ui/GlobalSearch";
import Sidebar from './Sidebar';

const AppLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const { theme } = useTheme();

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  const sidebarWidth = sidebarCollapsed ? 72 : 260;

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.colors.bgGradient,
    }}>
      <Sidebar 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      <div style={{ 
        position: "fixed", 
        top: 16, 
        left: sidebarWidth + 20, 
        right: 24, 
        zIndex: 900, 
        display: "flex",
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <GlobalSearch />
      </div>
      <main className="main-content" style={{
        marginLeft: sidebarWidth,
        padding: '80px 36px 32px',
        minHeight: '100vh',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserPlus, CalendarPlus, CalendarDays,
  CheckSquare, Shield, LogOut, Moon, Sun, Menu, X, Building2, Package, BarChart2,
  GraduationCap, Coins, LineChart, ChevronLeft, ChevronRight, Clock
} from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
import useAuth from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';
import NotificationBell from '../ui/NotificationBell';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/attendance', label: 'Attendance', icon: Clock },
  { path: '/employees', label: 'Employees', icon: Users },
  { path: '/employees/create', label: 'Add Employee', icon: UserPlus },
  { path: '/students', label: 'Students', icon: GraduationCap, roles: ['admin', 'hr', 'manager'] },
  { path: '/salaries', label: 'Salary Sheets', icon: Coins, roles: ['admin', 'hr', 'manager'] },
  { path: '/salary-reports', label: 'Salary Reports', icon: LineChart, roles: ['admin', 'hr', 'manager'] },
  { path: '/leave/apply', label: 'Apply Leave', icon: CalendarPlus },
  { path: '/leave/my', label: 'My Leaves', icon: CalendarDays },
  { path: '/leave/approval', label: 'Approvals', icon: CheckSquare, roles: ['admin', 'hr', 'manager'] },
  { path: '/assets', label: 'Assets', icon: Package, roles: ['admin', 'hr', 'manager'] },
  { path: '/reports', label: 'Reports', icon: BarChart2, roles: ['admin', 'hr', 'manager'] },
  { path: '/admin', label: 'Admin Panel', icon: Shield, roles: ['admin'] },
];

const Sidebar = ({ mobileOpen, setMobileOpen, isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, handleLogout, isAdmin, canApprove } = useAuth();

  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.roles) return true;
    if (user && item.roles.includes(user.role)) return true;
    if (item.roles.includes('admin') && isAdmin) return true;
    if (item.path === '/leave/approval' && canApprove) return true;
    if (item.path === '/assets' && (isAdmin || canApprove)) return true;
    return false;
  });

  const isActive = (path) => {
    if (path === '/employees') return location.pathname === '/employees';
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* CSS Injection for webkit scrollbar hiding */}
      <style>{`
        .sidebar-nav::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Header (Fixed) */}
      <div style={{ 
        padding: isCollapsed ? '24px 12px' : '24px 20px', 
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 80,
        boxSizing: 'border-box',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
          <div style={{ 
            width: 38, 
            height: 38, 
            borderRadius: 10, 
            background: 'linear-gradient(135deg, ' + theme.colors.accent + ', ' + theme.colors.blue + ')', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Building2 size={20} color="#fff" />
          </div>
          {!isCollapsed && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>i-SOFTZONE</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em' }}>HRMS SYSTEM</div>
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(true)}
            style={{ 
              background: 'rgba(255,255,255,0.04)', 
              border: 'none', 
              color: 'rgba(255,255,255,0.6)', 
              cursor: 'pointer',
              borderRadius: 6,
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Expanded Collapse Trigger inside collapsed view */}
      {isCollapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', flexShrink: 0 }}>
          <button 
            onClick={() => setIsCollapsed(false)}
            style={{ 
              background: 'rgba(255,255,255,0.04)', 
              border: 'none', 
              color: 'rgba(255,255,255,0.6)', 
              cursor: 'pointer',
              borderRadius: 6,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Nav List (Middle Scrollable) */}
      <nav 
        className="sidebar-nav"
        style={{ 
          flex: 1, 
          padding: isCollapsed ? '10px 8px' : '16px 12px', 
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {visibleItems.map(item => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              title={isCollapsed ? item.label : undefined}
              style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: isCollapsed ? 0 : 12, 
                padding: '12px 14px', 
                marginBottom: 4, 
                borderRadius: 12, 
                border: 'none', 
                cursor: 'pointer', 
                fontFamily: 'inherit', 
                fontSize: 14, 
                fontWeight: active ? 600 : 500, 
                color: active ? '#fff' : 'rgba(255,255,255,0.65)', 
                background: active ? theme.colors.sidebarActive : 'transparent', 
                transition: 'all 0.2s ease', 
                textAlign: 'left',
                position: 'relative'
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = theme.colors.sidebarHover; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!isCollapsed && <span>{item.label}</span>}
              {!isCollapsed && active && (
                <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer (Fixed) */}
      <div style={{ 
        padding: isCollapsed ? '12px 8px' : '16px 12px', 
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(10,10,15,0.3)',
        flexShrink: 0
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: isCollapsed ? 0 : 12, 
          padding: '10px', 
          borderRadius: 12, 
          background: 'rgba(255,255,255,0.04)', 
          marginBottom: 8 
        }}>
          <Avatar name={user?.name} size={30} />
          {!isCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          )}
        </div>
        {!isCollapsed && <NotificationBell />}
        <button 
          onClick={toggleTheme} 
          title={isCollapsed ? (isDark ? 'Light Mode' : 'Dark Mode') : undefined}
          style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? 0 : 12, 
            padding: '10px 14px', 
            borderRadius: 10, 
            border: 'none', 
            background: 'transparent', 
            color: 'rgba(255,255,255,0.6)', 
            cursor: 'pointer', 
            fontFamily: 'inherit', 
            fontSize: 13, 
            marginBottom: 4 
          }}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          {!isCollapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button 
          onClick={handleLogout} 
          title={isCollapsed ? 'Sign Out' : undefined}
          style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? 0 : 12, 
            padding: '10px 14px', 
            borderRadius: 10, 
            border: 'none', 
            background: 'transparent', 
            color: theme.colors.accent, 
            cursor: 'pointer', 
            fontFamily: 'inherit', 
            fontSize: 13, 
            fontWeight: 500 
          }}
        >
          <LogOut size={16} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} style={{ display: 'none', position: 'fixed', top: 16, left: 16, zIndex: 1001, width: 44, height: 44, borderRadius: 12, border: '1px solid ' + theme.colors.border, background: theme.colors.glass, backdropFilter: 'blur(12px)', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', color: theme.colors.text }}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} style={{ display: 'none', position: 'fixed', inset: 0, background: theme.colors.overlay, zIndex: 999 }} />}
      <aside 
        className={'sidebar ' + (mobileOpen ? 'sidebar-open' : '')} 
        style={{ 
          position: 'fixed', 
          left: 0, 
          top: 0, 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          width: isCollapsed ? 72 : 260, 
          background: theme.colors.sidebarBg, 
          backdropFilter: 'blur(20px)', 
          zIndex: 1000, 
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;

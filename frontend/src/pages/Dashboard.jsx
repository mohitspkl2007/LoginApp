import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import axios from 'axios';
import {
  Users, Building2, Target, Image, Clock,
  Mail, ArrowRight, Activity, Plus
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from 'recharts';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import GlassCard from '../components/ui/GlassCard';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { useTheme } from '../theme/ThemeContext';
import API_URL from '../config/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function ChartContainer({ title, subtitle, children, style }) {
  const { theme } = useTheme();
  return (
    <GlassCard style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', ...style }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: theme.colors.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 }}>{subtitle}</div>}
      </div>
      <div style={{ flex: 1, minHeight: 240, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {children}
      </div>
    </GlassCard>
  );
}

function EmptyChart({ theme }) {
  return (
    <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.textMuted, fontSize: 13 }}>
      No data available yet
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, loading } = useAuth();

  const [stats, setStats] = useState({});
  const [leaveStats, setLeaveStats] = useState({});
  const [deptData, setDeptData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [leaveTypeData, setLeaveTypeData] = useState([]);
  const [assetStats, setAssetStats] = useState({ total: 0, allocated: 0, available: 0 });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      const headers = { Authorization: token };
      try {
        const [empStats, lvStats, deptStats, monthly, leaveTypes, assets, leaves, todayAtt] = await Promise.all([
          axios.get(`${API_URL}/api/employees/stats/dashboard`, { headers }),
          axios.get(`${API_URL}/api/leave/stats`, { headers }),
          axios.get(`${API_URL}/api/employees/stats/by-department`, { headers }),
          axios.get(`${API_URL}/api/employees/stats/monthly-joining`, { headers }),
          axios.get(`${API_URL}/api/leave/stats/by-type`, { headers }),
          axios.get(`${API_URL}/api/assets`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/api/leave/my`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/api/attendance/today`, { headers }).catch(() => ({ data: null }))
        ]);
        
        setStats(empStats.data);
        setLeaveStats(lvStats.data);
        setDeptData(deptStats.data);
        setMonthlyData(monthly.data);
        setLeaveTypeData(leaveTypes.data.filter(d => d.value > 0));
        setAttendanceToday(todayAtt ? todayAtt.data : null);
        
        const allAssets = Array.isArray(assets.data) ? assets.data : (assets.data?.assets || []);
        setAssetStats({
          total: allAssets.length,
          allocated: allAssets.filter(a => a.status === 'allocated').length,
          available: allAssets.filter(a => a.status === 'available').length,
        });

        // Get up to 5 recent leaves
        setRecentLeaves(Array.isArray(leaves.data) ? leaves.data.slice(0, 5) : []);
      } catch (err) {
        console.error(err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    let intervalId;
    if (attendanceToday && attendanceToday.checkInTime && !attendanceToday.checkOutTime) {
      const checkIn = new Date(attendanceToday.checkInTime).getTime();
      
      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = now - checkIn;
        if (diff < 0) {
          setElapsedTime('00:00:00');
          return;
        }
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        
        const pad = (num) => String(num).padStart(2, '0');
        setElapsedTime(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
      };
      
      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
    } else if (attendanceToday && attendanceToday.checkInTime && attendanceToday.checkOutTime) {
      const diff = new Date(attendanceToday.checkOutTime).getTime() - new Date(attendanceToday.checkInTime).getTime();
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      const pad = (num) => String(num).padStart(2, '0');
      setElapsedTime(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
    } else {
      setElapsedTime('00:00:00');
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [attendanceToday]);

  const handleCheckIn = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: token };
    try {
      const res = await axios.post(`${API_URL}/api/attendance/checkin`, { location: 'Office' }, { headers });
      setAttendanceToday(res.data.record);
    } catch (err) {
      console.error('Checkin failed:', err.message);
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: token };
    try {
      const res = await axios.post(`${API_URL}/api/attendance/checkout`, {}, { headers });
      setAttendanceToday(res.data.record);
    } catch (err) {
      console.error('Checkout failed:', err.message);
      alert(err.response?.data?.message || 'Check-out failed');
    }
  };

  if (loading || !user) {
    return (
      <AppLayout>
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  const roleVariant = user?.role === 'admin' ? 'admin' : 'success';

  return (
    <AppLayout>
      <PageHeader
        title={`Welcome back, ${user.name?.split(' ')[0]}`}
        subtitle="Here's what's happening across your organization today"
      />

      {/* Profile banner */}
      <GlassCard style={{ padding: 24, marginBottom: 28, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
        <Avatar name={user.name} size={64} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: theme.colors.text }}>
            {user.name}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: theme.colors.textSecondary }}>
              <Mail size={14} /> {user.email}
            </span>
            <Badge variant={roleVariant}>{user.role}</Badge>
          </div>
        </div>
        
        {/* Action Triggers */}
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" icon={Clock} onClick={() => navigate('/attendance')}>
            Attendance
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => navigate('/leave/apply')}>
            Apply Leave
          </Button>
        </div>
      </GlassCard>

      {/* Work Attendance Check In / Check Out Card */}
      <GlassCard style={{ padding: 24, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.colors.text }}>Daily Work Attendance</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: theme.colors.textSecondary }}>
              {!attendanceToday?.checkInTime 
                ? 'You have not checked in today. Please check in to record your attendance.' 
                : attendanceToday.checkOutTime 
                  ? 'You have successfully completed your shifts for today.' 
                  : 'Your shift is active. Keep up the good work!'}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>Today's Timer</div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: !attendanceToday?.checkInTime ? theme.colors.textMuted : attendanceToday.checkOutTime ? theme.colors.success : theme.colors.warning }}>
                {elapsedTime}
              </div>
            </div>
            
            {!attendanceToday?.checkInTime ? (
              <button 
                onClick={handleCheckIn}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.4)';
                }}
              >
                Check In
              </button>
            ) : !attendanceToday?.checkOutTime ? (
              <button 
                onClick={handleCheckOut}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.6)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.4)';
                }}
              >
                Check Out
              </button>
            ) : (
              <div 
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  padding: '10px 20px',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
                Shift Completed
              </div>
            )}
          </div>
        </div>

        {/* Detailed Times row if checked in */}
        {attendanceToday?.checkInTime && (
          <div style={{ display: 'flex', gap: 24, borderTop: `1px solid ${theme.colors.border}`, paddingTop: 16, marginTop: 4 }}>
            <div>
              <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>Check-In Time</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.text, marginTop: 2 }}>
                {new Date(attendanceToday.checkInTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
            {attendanceToday?.checkOutTime && (
              <div>
                <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>Check-Out Time</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.text, marginTop: 2 }}>
                  {new Date(attendanceToday.checkOutTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>Status</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: attendanceToday.status === 'Present' || attendanceToday.status === 'WFH' ? theme.colors.success : attendanceToday.status === 'Late' ? theme.colors.warning : '#f97316', marginTop: 2 }}>
                {attendanceToday.status}
              </div>
            </div>
            {attendanceToday?.location && (
              <div>
                <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>Work Mode / Location</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.text, marginTop: 2 }}>
                  {attendanceToday.location}
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* Company stats */}
      <h3 style={{ fontSize: 12, fontWeight: 700, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
        Company Overview
      </h3>
      {statsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 120, borderRadius: 16, background: theme.colors.glass }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees || 0}
            icon={Users}
            color={theme.colors.blue}
            onClick={() => navigate('/employees')}
          />
          <StatCard
            title="Departments"
            value={stats.totalDepartments || 0}
            icon={Building2}
            color={theme.colors.success}
          />
          <StatCard
            title="Skills Tracked"
            value={stats.totalSkills || 0}
            icon={Target}
            color={theme.colors.warning}
          />
          <StatCard
            title="Profile Images"
            value={stats.totalImages || 0}
            icon={Image}
            color={theme.colors.accent}
          />
        </div>
      )}

      {/* Grid: Assets & Leaves metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
        {/* Assets Card */}
        <GlassCard style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: theme.colors.text }}>Asset Inventories</h4>
            <Button size="sm" variant="secondary" icon={ArrowRight} onClick={() => navigate('/assets')}>View All</Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>Total</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{assetStats.total}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: theme.colors.warning }}>Allocated</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{assetStats.allocated}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: theme.colors.success }}>Available</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{assetStats.available}</div>
            </div>
          </div>
        </GlassCard>

        {/* Leave status summary */}
        <GlassCard style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: theme.colors.text }}>Leave Summaries</h4>
            <Button size="sm" variant="secondary" icon={ArrowRight} onClick={() => navigate('/leave/my')}>My Leaves</Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: theme.colors.warning }}>Pending</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{leaveStats.pending || 0}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: theme.colors.success }}>Approved</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{leaveStats.approved || 0}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: theme.colors.danger }}>Rejected</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{leaveStats.rejected || 0}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: theme.colors.info }}>Total</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{leaveStats.total || 0}</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Analytics Charts Grid */}
      <h3 style={{ fontSize: 12, fontWeight: 700, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
        Analytics & Reporting
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Chart 1: Department distribution */}
        <ChartContainer title="Employees by Department" subtitle="Headcount per organizational division">
          {deptData.length === 0 ? (
            <EmptyChart theme={theme} />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deptData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} opacity={0.3} />
                <XAxis dataKey="department" tick={{ fontSize: 11, fill: theme.colors.textSecondary }} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: theme.colors.textSecondary }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: theme.colors.inputBg, border: `1px solid ${theme.colors.border}`, borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Bar dataKey="employees" fill={theme.colors.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        {/* Chart 2: Leave category breakdown */}
        <ChartContainer title="Leave requests by Category" subtitle="Distribution across request types">
          {leaveTypeData.length === 0 ? (
            <EmptyChart theme={theme} />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie 
                  data={leaveTypeData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="45%" 
                  outerRadius={80} 
                  label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  style={{ outline: 'none' }}
                >
                  {leaveTypeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: theme.colors.inputBg, border: `1px solid ${theme.colors.border}`, borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: theme.colors.textSecondary }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        {/* Chart 3: Area Join Trends */}
        <ChartContainer title="Employee Join Trends" subtitle="Monthly onboarding activity">
          {monthlyData.length === 0 ? (
            <EmptyChart theme={theme} />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                <defs>
                  <linearGradient id="joinGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.colors.success} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={theme.colors.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: theme.colors.textSecondary }} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: theme.colors.textSecondary }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: theme.colors.inputBg, border: `1px solid ${theme.colors.border}`, borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke={theme.colors.success} strokeWidth={2} fill="url(#joinGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        {/* Chart 4: Leave status trends */}
        <ChartContainer title="Leave Request Activity" subtitle="Comparison across approval classifications">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={[
                { status: 'Pending', count: leaveStats.pending || 0 },
                { status: 'Approved', count: leaveStats.approved || 0 },
                { status: 'Rejected', count: leaveStats.rejected || 0 },
                { status: 'Total', count: leaveStats.total || 0 },
              ]}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} opacity={0.3} />
              <XAxis dataKey="status" tick={{ fontSize: 12, fill: theme.colors.textSecondary }} />
              <YAxis tick={{ fontSize: 11, fill: theme.colors.textSecondary }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: theme.colors.inputBg, border: `1px solid ${theme.colors.border}`, borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke={theme.colors.warning} strokeWidth={2.5} dot={{ r: 5, fill: theme.colors.warning }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Grid: Bottom row (Recent Activity Timeline / Leave list) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        <GlassCard style={{ padding: 24 }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} color={theme.colors.accent} /> Recent Leave Activity
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentLeaves.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: theme.colors.textMuted, fontSize: 14 }}>
                No recent leave activity recorded.
              </div>
            ) : (
              recentLeaves.map((leave, i) => (
                <div key={leave.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.colors.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{leave.leaveType?.name || 'Leave Request'}</div>
                    <div style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 4 }}>
                      {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()} ({leave.days} days)
                    </div>
                  </div>
                  <Badge variant={leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'danger' : 'warning'}>
                    {leave.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </AppLayout>
  );
}

export default Dashboard;

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Line, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { RefreshCw, GraduationCap, Coins } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import { useTheme } from '../theme/ThemeContext';
import API_URL from '../config/api';

function SalaryReports() {
  const { theme } = useTheme();
  const token = localStorage.getItem('token');

  // Data states
  const [studentStats, setStudentStats] = useState(null);
  const [salaryStats, setSalaryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch charts data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const headers = { Authorization: token };
    try {
      const [stuRes, salRes] = await Promise.all([
        axios.get(`${API_URL}/api/students/stats`, { headers }),
        axios.get(`${API_URL}/api/salaries/stats`, { headers })
      ]);
      setStudentStats(stuRes.data);
      setSalaryStats(salRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch stats and chart data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const PIE_COLORS = [theme.colors.accent, theme.colors.info, theme.colors.success, theme.colors.warning, '#8b5cf6'];

  return (
    <AppLayout>
      <PageHeader 
        title="Interactive Payroll & Student Reports" 
        subtitle="Analytical graphs representing student demographics alongside employee salary and attendance comparisons."
        action={
          <button onClick={fetchData} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.glass, color: theme.colors.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
            <RefreshCw size={14} /> Refresh Data
          </button>
        }
      />

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: theme.colors.textSecondary }}>Loading analysis reports...</div>
      ) : error ? (
        <div style={{ padding: 60, textAlign: 'center', color: theme.colors.danger }}>{error}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 24 }}>
          
          {/* GRAPH 1: Student Study Mode Distribution (Pie Chart) */}
          <GlassCard style={{ padding: 24, display: 'flex', flexDirection: 'column', height: 380 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <GraduationCap size={18} color={theme.colors.info} />
              <span style={{ fontSize: 15, fontWeight: 700, color: theme.colors.text }}>1. Student Modes Distribution</span>
            </div>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={studentStats?.modeData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {(studentStats?.modeData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: theme.colors.sidebarBg, border: '1px solid ' + theme.colors.border, borderRadius: 8 }} 
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* GRAPH 2: Students by Semester (Bar Chart) */}
          <GlassCard style={{ padding: 24, display: 'flex', flexDirection: 'column', height: 380 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <GraduationCap size={18} color={theme.colors.accent} />
              <span style={{ fontSize: 15, fontWeight: 700, color: theme.colors.text }}>2. Students Count by Semester</span>
            </div>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentStats?.semesterData || []} margin={{ bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: theme.colors.textSecondary, fontSize: 11 }} />
                  <YAxis tick={{ fill: theme.colors.textSecondary, fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ background: theme.colors.sidebarBg, border: '1px solid ' + theme.colors.border, borderRadius: 8 }} 
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" fill={theme.colors.accent} radius={[4, 4, 0, 0]} name="Students">
                    {(studentStats?.semesterData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* GRAPH 3: Students by Learning Domain (Horizontal Bar Chart) */}
          <GlassCard style={{ padding: 24, display: 'flex', flexDirection: 'column', height: 380 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <GraduationCap size={18} color={theme.colors.success} />
              <span style={{ fontSize: 15, fontWeight: 700, color: theme.colors.text }}>3. Students by Learning Domain</span>
            </div>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={studentStats?.domainData || []} 
                  layout="vertical"
                  margin={{ left: 30, right: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" tick={{ fill: theme.colors.textSecondary, fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: theme.colors.textSecondary, fontSize: 11 }} width={120} />
                  <Tooltip 
                    contentStyle={{ background: theme.colors.sidebarBg, border: '1px solid ' + theme.colors.border, borderRadius: 8 }} 
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" fill={theme.colors.info} radius={[0, 4, 4, 0]} name="Students">
                    {(studentStats?.domainData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* GRAPH 4: Employee Base vs Net Salary (Composed Chart) */}
          <GlassCard style={{ padding: 24, display: 'flex', flexDirection: 'column', height: 380 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Coins size={18} color={theme.colors.warning} />
              <span style={{ fontSize: 15, fontWeight: 700, color: theme.colors.text }}>
                4. Base vs Net Salary (Period: {salaryStats?.latestMonth || 'Current'})
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salaryStats?.baseVsNetData || []} margin={{ bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: theme.colors.textSecondary, fontSize: 11 }} />
                  <YAxis tick={{ fill: theme.colors.textSecondary, fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ background: theme.colors.sidebarBg, border: '1px solid ' + theme.colors.border, borderRadius: 8 }} 
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="base" fill={theme.colors.blue + '99'} name="Base Salary" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="net" stroke={theme.colors.accent} strokeWidth={2.5} name="Net Payout" activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* GRAPH 5: Net Salary vs Attendance (Scatter Chart) */}
          <GlassCard style={{ padding: 24, display: 'flex', flexDirection: 'column', height: 380, gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Coins size={18} color={theme.colors.success} />
              <span style={{ fontSize: 15, fontWeight: 700, color: theme.colors.text }}>5. Employee Net Salary vs Attendance (Present Days)</span>
            </div>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                  <XAxis 
                    type="number" 
                    dataKey="present" 
                    name="Present Days" 
                    unit=" days" 
                    domain={[0, 31]}
                    tick={{ fill: theme.colors.textSecondary, fontSize: 11 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="salary" 
                    name="Net Salary" 
                    unit=" ₹"
                    tick={{ fill: theme.colors.textSecondary, fontSize: 11 }}
                  />
                  <ZAxis dataKey="name" name="Employee" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ background: theme.colors.sidebarBg, border: '1px solid ' + theme.colors.border, borderRadius: 8 }} 
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Scatter name="Employee Slips" data={salaryStats?.attendanceVsSalaryData || []} fill={theme.colors.accent} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

        </div>
      )}
    </AppLayout>
  );
}

export default SalaryReports;

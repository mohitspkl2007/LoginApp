import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, List as ListIcon, Plus, Search, 
  ChevronLeft, ChevronRight, Filter, Clock, User as UserIcon, X
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../theme/ThemeContext';
import axios from 'axios';
import API_URL from '../config/api';

function Attendance() {
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const isPowerUser = isAdmin || user?.role === 'hr' || user?.role === 'manager';

  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [attendanceList, setAttendanceList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [modalUserId, setModalUserId] = useState('');
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalStatus, setModalStatus] = useState('Present');
  const [modalCheckIn, setModalCheckIn] = useState('');
  const [modalCheckOut, setModalCheckOut] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: token };
    try {
      if (isPowerUser) {
        // Get all attendance
        const res = await axios.get(`${API_URL}/api/attendance/all`, { headers });
        setAttendanceList(res.data);
        // Get employee list for modal dropdown
        const empRes = await axios.get(`${API_URL}/api/employees`, { headers });
        setEmployees(empRes.data);
      } else {
        // Get personal attendance
        const res = await axios.get(`${API_URL}/api/attendance/my-history`, { headers });
        // Map personal records to match all-attendance structure (injecting user name)
        const mapped = res.data.map(a => ({
          ...a,
          name: user?.name || 'Unknown',
          email: user?.email || '',
        }));
        setAttendanceList(mapped);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load attendance logs');
    } finally {
      setLoading(false);
    }
  }, [isPowerUser, user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calendar logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Filter lists
  const filteredList = attendanceList.filter(item => {
    const matchesSearch = isPowerUser 
      ? (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || item.email?.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    const matchesDept = deptFilter ? item.department === deptFilter : true;
    const matchesStatus = statusFilter ? item.status?.toLowerCase() === statusFilter.toLowerCase() : true;
    
    let matchesDate = true;
    if (dateFilter) {
      const itemDateStr = new Date(item.date).toISOString().split('T')[0];
      matchesDate = itemDateStr === dateFilter;
    }
    
    return matchesSearch && matchesDept && matchesStatus && matchesDate;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': return theme.colors.success;
      case 'late': return theme.colors.warning;
      case 'wfh': return theme.colors.info;
      case 'half day':
      case 'half-day': return '#f97316'; // orange
      case 'absent': return theme.colors.danger;
      default: return theme.colors.textMuted;
    }
  };

  // Open modal for marking attendance
  const openMarkModal = (record = null) => {
    if (record) {
      // Editing mode
      setEditingRecord(record);
      setModalUserId((record.employeeId || record.userId || '').toString());
      setModalDate(new Date(record.date).toISOString().split('T')[0]);
      setModalStatus(record.status);
      const checkInVal = record.checkInTime || record.checkIn;
      const checkOutVal = record.checkOutTime || record.checkOut;
      setModalCheckIn(checkInVal ? new Date(checkInVal).toISOString().substring(11, 16) : '');
      setModalCheckOut(checkOutVal ? new Date(checkOutVal).toISOString().substring(11, 16) : '');
    } else {
      // Create mode
      setEditingRecord(null);
      setModalUserId(isPowerUser ? '' : user.id.toString());
      setModalDate(new Date().toISOString().split('T')[0]);
      setModalStatus('Present');
      setModalCheckIn('09:00');
      setModalCheckOut('18:00');
    }
    setModalOpen(true);
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!modalUserId || !modalDate || !modalStatus) {
      toast.warning('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: token };

    // Format checkIn/checkOut times to full dates
    let formattedCheckIn = null;
    let formattedCheckOut = null;

    if (modalCheckIn) {
      formattedCheckIn = new Date(`${modalDate}T${modalCheckIn}:00`);
    }
    if (modalCheckOut) {
      formattedCheckOut = new Date(`${modalDate}T${modalCheckOut}:00`);
    }

    try {
      if (editingRecord) {
        // Update endpoint PUT /api/attendance/:id
        await axios.put(`${API_URL}/api/attendance/${editingRecord.id}`, {
          status: modalStatus,
          checkInTime: formattedCheckIn,
          checkOutTime: formattedCheckOut
        }, { headers });
        toast.success('Attendance updated successfully');
      } else {
        // Create endpoint POST /api/attendance/mark
        await axios.post(`${API_URL}/api/attendance/mark`, {
          employeeId: parseInt(modalUserId),
          date: modalDate,
          status: modalStatus,
          checkInTime: formattedCheckIn,
          checkOutTime: formattedCheckOut
        }, { headers });
        toast.success('Attendance marked successfully');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save attendance record');
    } finally {
      setSubmitting(false);
    }
  };

  // Render Calendar Grid
  const renderCalendar = () => {
    const days = [];
    // Blank padding cells for layout alignment
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} style={{ height: 110, borderBottom: `1px solid ${theme.colors.border}`, borderRight: `1px solid ${theme.colors.border}`, opacity: 0.1 }} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const thisDayDate = new Date(currentYear, currentMonth, day);
      thisDayDate.setHours(0, 0, 0, 0);

      // Find attendance records on this date
      const dayRecords = filteredList.filter(record => {
        const d = new Date(record.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === thisDayDate.getTime();
      });

      const isToday = new Date().toDateString() === thisDayDate.toDateString();

      days.push(
        <div 
          key={`day-${day}`} 
          style={{ 
            height: 110, 
            borderBottom: `1px solid ${theme.colors.border}`, 
            borderRight: `1px solid ${theme.colors.border}`, 
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: isToday ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ 
              fontSize: 13, 
              fontWeight: 700, 
              color: isToday ? theme.colors.accent : theme.colors.text,
              background: isToday ? theme.colors.accent + '22' : 'transparent',
              padding: '2px 6px',
              borderRadius: 6
            }}>
              {day}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', maxHeight: 70 }}>
            {dayRecords.map((rec, idx) => (
              <div 
                key={idx} 
                onClick={() => isPowerUser && openMarkModal(rec)}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '4px 6px',
                  borderRadius: 6,
                  background: `${getStatusColor(rec.status)}15`,
                  border: `1px solid ${getStatusColor(rec.status)}30`,
                  color: getStatusColor(rec.status),
                  cursor: isPowerUser ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 4
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isPowerUser ? rec.name.split(' ')[0] : rec.status}
                </span>
                {rec.workingHours && <span style={{ fontSize: 9, opacity: 0.8 }}>{rec.workingHours}h</span>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  // Extract list of departments from employees for filter list
  const departments = [...new Set(employees.map(e => e.departmentName).filter(Boolean))];

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <PageHeader 
          title="Attendance Logs" 
          subtitle={isPowerUser ? "Manage and track organization-wide attendance records" : "View your monthly check-ins and attendance records"} 
        />
        {isPowerUser && (
          <Button 
            variant="primary" 
            icon={Plus} 
            onClick={() => openMarkModal(null)}
          >
            Mark Attendance
          </Button>
        )}
      </div>

      {/* Control Bar */}
      <GlassCard style={{ padding: 16, marginBottom: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        {/* Left Side: View Toggle & Month Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 8 }}>
            <button 
              onClick={() => setViewMode('calendar')}
              style={{
                border: 'none',
                background: viewMode === 'calendar' ? theme.colors.accent : 'transparent',
                color: viewMode === 'calendar' ? '#fff' : 'rgba(255,255,255,0.5)',
                padding: '6px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600
              }}
            >
              <CalendarIcon size={14} /> Calendar
            </button>
            <button 
              onClick={() => setViewMode('list')}
              style={{
                border: 'none',
                background: viewMode === 'list' ? theme.colors.accent : 'transparent',
                color: viewMode === 'list' ? '#fff' : 'rgba(255,255,255,0.5)',
                padding: '6px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600
              }}
            >
              <ListIcon size={14} /> List View
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={handlePrevMonth} style={{ background: 'rgba(255,255,255,0.04)', border: 'none', color: '#fff', padding: 6, borderRadius: 6, cursor: 'pointer' }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 700, minWidth: 110, textAlign: 'center' }}>
              {monthName} {currentYear}
            </span>
            <button onClick={handleNextMonth} style={{ background: 'rgba(255,255,255,0.04)', border: 'none', color: '#fff', padding: 6, borderRadius: 6, cursor: 'pointer' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Side: Filters (Only for power users) */}
        {isPowerUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, justifySelf: 'flex-end', maxWidth: 650, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 150px', minWidth: 120 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.colors.textMuted }} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${theme.colors.border}`,
                  padding: '10px 12px 10px 36px',
                  borderRadius: 8,
                  color: '#fff',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            {/* Department Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select 
                value={deptFilter} 
                onChange={e => setDeptFilter(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${theme.colors.border}`,
                  padding: '9px 12px',
                  borderRadius: 8,
                  color: '#fff',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  outline: 'none'
                }}
              >
                <option value="" style={{ background: theme.colors.bg }}>All Depts</option>
                {departments.map(d => (
                  <option key={d} value={d} style={{ background: theme.colors.bg }}>{d}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${theme.colors.border}`,
                  padding: '9px 12px',
                  borderRadius: 8,
                  color: '#fff',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  outline: 'none'
                }}
              >
                <option value="" style={{ background: theme.colors.bg }}>All Statuses</option>
                {['Present', 'Late', 'WFH', 'Half-day', 'Absent'].map(st => (
                  <option key={st} value={st} style={{ background: theme.colors.bg }}>{st}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input 
                type="date"
                value={dateFilter} 
                onChange={e => setDateFilter(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${theme.colors.border}`,
                  padding: '8px 12px',
                  borderRadius: 8,
                  color: '#fff',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  outline: 'none'
                }}
              />
            </div>
          </div>
        )}
      </GlassCard>

      {/* Main Grid View */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <span style={{ fontSize: 14, color: theme.colors.textSecondary }}>Loading attendance data...</span>
        </div>
      ) : viewMode === 'calendar' ? (
        <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
          {/* Calendar Grid Header */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            background: 'rgba(255,255,255,0.02)',
            borderBottom: `1px solid ${theme.colors.border}`
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, fontWeight: 700, color: theme.colors.textSecondary }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid Days */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderRight: 'none'
          }}>
            {renderCalendar()}
          </div>
        </GlassCard>
      ) : (
        /* List View */
        <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${theme.colors.border}` }}>
                  <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: theme.colors.textSecondary }}>Employee</th>
                  <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: theme.colors.textSecondary }}>Date</th>
                  <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: theme.colors.textSecondary }}>Status</th>
                  <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: theme.colors.textSecondary }}>Check In</th>
                  <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: theme.colors.textSecondary }}>Check Out</th>
                  <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: theme.colors.textSecondary }}>Working Hours</th>
                  {isPowerUser && <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: theme.colors.textSecondary, width: 80 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={isPowerUser ? 7 : 6} style={{ padding: 36, textAlign: 'center', color: theme.colors.textMuted, fontSize: 14 }}>
                      No attendance records found for this period.
                    </td>
                  </tr>
                ) : (
                  filteredList.map(item => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${theme.colors.border}`, transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: theme.colors.accent + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.accent, fontWeight: 700, fontSize: 12 }}>
                            {item.name?.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                            {isPowerUser && <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>{item.department} | {item.designation}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 13 }}>
                        {new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <Badge style={{
                          background: `${getStatusColor(item.status)}15`,
                          borderColor: `${getStatusColor(item.status)}30`,
                          color: getStatusColor(item.status),
                        }}>
                          {item.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 13, color: theme.colors.textSecondary }}>
                        {item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : (item.checkIn ? new Date(item.checkIn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '-')}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 13, color: theme.colors.textSecondary }}>
                        {item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : (item.checkOut ? new Date(item.checkOut).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '-')}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600 }}>
                        {item.workingHours ? `${item.workingHours} hrs` : '-'}
                      </td>
                      {isPowerUser && (
                        <td style={{ padding: '16px 24px' }}>
                          <button 
                            onClick={() => openMarkModal(item)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: theme.colors.textSecondary,
                              cursor: 'pointer',
                              padding: 4,
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = theme.colors.accent}
                            onMouseLeave={e => e.currentTarget.style.color = theme.colors.textSecondary}
                          >
                            <Clock size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Modal Layout */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: theme.colors.overlay,
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <GlassCard style={{ width: '100%', maxWidth: 440, padding: 28, boxShadow: theme.colors.glassShadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                {editingRecord ? 'Edit Attendance Record' : 'Mark Attendance Record'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: theme.colors.textSecondary, cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Employee Selection */}
              {isPowerUser && !editingRecord ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>Select Employee</label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.colors.textMuted }} />
                    <select 
                      value={modalUserId}
                      onChange={e => setModalUserId(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${theme.colors.border}`,
                        padding: '12px 12px 12px 36px',
                        borderRadius: 8,
                        color: '#fff',
                        fontFamily: 'inherit',
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="" style={{ background: theme.colors.bg }}>-- Select Employee --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id} style={{ background: theme.colors.bg }}>
                          {emp.name} ({emp.departmentName || 'No Dept'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, color: theme.colors.textSecondary }}>Employee</span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>
                    {editingRecord ? editingRecord.name : user.name}
                  </span>
                </div>
              )}

              {/* Date Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>Date</label>
                <input 
                  type="date"
                  value={modalDate}
                  onChange={e => setModalDate(e.target.value)}
                  disabled={!!editingRecord}
                  required
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${theme.colors.border}`,
                    padding: '12px',
                    borderRadius: 8,
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    outline: 'none',
                    opacity: editingRecord ? 0.6 : 1
                  }}
                />
              </div>

              {/* Status Select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>Status</label>
                <select 
                  value={modalStatus}
                  onChange={e => setModalStatus(e.target.value)}
                  required
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${theme.colors.border}`,
                    padding: '12px',
                    borderRadius: 8,
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    outline: 'none'
                  }}
                >
                  {['Present', 'Late', 'WFH', 'Half Day', 'Absent'].map(status => (
                    <option key={status} value={status} style={{ background: theme.colors.bg }}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Check-In / Out Times (Optional for Absent) */}
              {modalStatus !== 'Absent' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>Check In</label>
                    <input 
                      type="time"
                      value={modalCheckIn}
                      onChange={e => setModalCheckIn(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${theme.colors.border}`,
                        padding: '12px',
                        borderRadius: 8,
                        color: '#fff',
                        fontFamily: 'inherit',
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>Check Out</label>
                    <input 
                      type="time"
                      value={modalCheckOut}
                      onChange={e => setModalCheckOut(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${theme.colors.border}`,
                        padding: '12px',
                        borderRadius: 8,
                        color: '#fff',
                        fontFamily: 'inherit',
                        fontSize: 13,
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <Button 
                  type="button" 
                  variant="secondary" 
                  fullWidth
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  fullWidth
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Record'}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </AppLayout>
  );
}

export default Attendance;

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Plus, Edit2, Trash2, Search, Filter, RefreshCw, 
  GraduationCap, Globe, Building, Laptop
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import { useTheme } from '../theme/ThemeContext';
import API_URL from '../config/api';

function Students() {
  const { theme } = useTheme();
  const token = localStorage.getItem('token');

  // Lists & data states
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Statistics
  const [stats, setStats] = useState({
    totalStudents: 0,
    online: 0,
    offline: 0,
    hybrid: 0
  });

  // Filter states
  const [search, setSearch] = useState('');
  const [semester, setSemester] = useState('all');
  const [city, setCity] = useState('all');
  const [domain, setDomain] = useState('all');
  const [mode, setMode] = useState('all');

  // Add/Edit Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSemester, setFormSemester] = useState('Semester 1');
  const [formCity, setFormCity] = useState('');
  const [formDomain, setFormDomain] = useState('Web Development');
  const [formMode, setFormMode] = useState('online');
  const [submitting, setSubmitting] = useState(false);

  // Pre-defined domains and semesters
  const domains = ['Web Development', 'ASIC Design', 'Data Science', 'Embedded Systems', 'Cybersecurity'];
  const semesters = [
    'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 
    'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'
  ];

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const headers = { Authorization: token };
    try {
      // Fetch students with filters
      const q = new URLSearchParams();
      if (search) q.append('search', search);
      if (semester !== 'all') q.append('semester', semester);
      if (city !== 'all' && city.trim() !== '') q.append('city', city);
      if (domain !== 'all') q.append('domain', domain);
      if (mode !== 'all') q.append('mode', mode);

      const res = await axios.get(`${API_URL}/api/students?${q.toString()}`, { headers });
      setStudents(res.data || []);

      // Fetch stats
      const statsRes = await axios.get(`${API_URL}/api/students/stats`, { headers });
      const sd = statsRes.data;
      
      const counts = { online: 0, offline: 0, hybrid: 0 };
      if (sd.modeData) {
        sd.modeData.forEach(item => {
          counts[item.name.toLowerCase()] = item.value;
        });
      }

      setStats({
        totalStudents: sd.totalStudents || 0,
        online: counts.online || 0,
        offline: counts.offline || 0,
        hybrid: counts.hybrid || 0
      });
      
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch students data.');
    } finally {
      setLoading(false);
    }
  }, [search, semester, city, domain, mode, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Modal for Add
  const handleAddOpen = () => {
    setEditId(null);
    setFormName('');
    setFormEmail('');
    setFormSemester('Semester 1');
    setFormCity('');
    setFormDomain('Web Development');
    setFormMode('online');
    setModalOpen(true);
  };

  // Open Modal for Edit
  const handleEditOpen = (student) => {
    setEditId(student.id);
    setFormName(student.name);
    setFormEmail(student.email);
    setFormSemester(student.semester);
    setFormCity(student.city);
    setFormDomain(student.domain);
    setFormMode(student.mode);
    setModalOpen(true);
  };

  // Save Student (Create/Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName || !formEmail || !formCity) {
      alert('Please fill out all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: formName,
        email: formEmail,
        semester: formSemester,
        city: formCity,
        domain: formDomain,
        mode: formMode
      };

      if (editId) {
        await axios.put(`${API_URL}/api/students/${editId}`, payload, { headers });
      } else {
        await axios.post(`${API_URL}/api/students`, payload, { headers });
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error occurred while saving student.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Student
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await axios.delete(`${API_URL}/api/students/${id}`, { headers });
      fetchData();
    } catch (err) {
      alert('Error occurred while deleting student.');
    }
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Students Management" 
        subtitle="Manage and filter study profiles, semester distribution, and student learning modes." 
        action={
          <Button onClick={handleAddOpen} variant="primary" size="medium" icon={Plus}>
            Add Student
          </Button>
        }
      />

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 24 }}>
        <StatCard title="Total Students" value={stats.totalStudents} icon={GraduationCap} color={theme.colors.accent} />
        <StatCard title="Online Learners" value={stats.online} icon={Laptop} color={theme.colors.info} />
        <StatCard title="Offline Classrooms" value={stats.offline} icon={Building} color={theme.colors.success} />
        <StatCard title="Hybrid Schedule" value={stats.hybrid} icon={Globe} color={theme.colors.warning} />
      </div>

      {/* Filter and Search Card */}
      <GlassCard style={{ padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Filter size={18} color={theme.colors.accent} />
          <span style={{ fontSize: 15, fontWeight: 700, color: theme.colors.text }}>Filter Students</span>
          <button onClick={fetchData} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: theme.colors.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {/* Search Box */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>Search by Name or Email</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
              />
              <Search size={16} color={theme.colors.textSecondary} style={{ position: 'absolute', left: 12, top: 12 }} />
            </div>
          </div>

          {/* Semester Filter */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>Semester</label>
            <select 
              value={semester} 
              onChange={(e) => setSemester(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
            >
              <option value="all">All Semesters</option>
              {semesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Domain Filter */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>Learning Domain</label>
            <select 
              value={domain} 
              onChange={(e) => setDomain(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
            >
              <option value="all">All Domains</option>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Mode Filter */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>Study Mode</label>
            <select 
              value={mode} 
              onChange={(e) => setMode(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
            >
              <option value="all">All Modes</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>City Filter</label>
            <input 
              type="text" 
              placeholder="e.g. Pune, Mumbai" 
              value={city === 'all' ? '' : city} 
              onChange={(e) => setCity(e.target.value === '' ? 'all' : e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
            />
          </div>
        </div>
      </GlassCard>

      {/* Student Table */}
      <GlassCard style={{ overflowX: 'auto', padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.colors.textSecondary }}>Loading students data...</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.colors.danger }}>{error}</div>
        ) : students.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.colors.textSecondary }}>No students found matching your filters.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid ' + theme.colors.border, background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: theme.colors.textSecondary }}>Name</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: theme.colors.textSecondary }}>Email</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: theme.colors.textSecondary }}>Semester</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: theme.colors.textSecondary }}>City</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: theme.colors.textSecondary }}>Domain</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: theme.colors.textSecondary }}>Mode</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: theme.colors.textSecondary, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid ' + theme.colors.border, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: theme.colors.text }}>{s.name}</td>
                  <td style={{ padding: '16px 24px', color: theme.colors.textSecondary }}>{s.email}</td>
                  <td style={{ padding: '16px 24px', color: theme.colors.text }}>{s.semester}</td>
                  <td style={{ padding: '16px 24px', color: theme.colors.text }}>{s.city}</td>
                  <td style={{ padding: '16px 24px', color: theme.colors.text }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: theme.colors.accent + '11', color: theme.colors.accent, fontWeight: 500 }}>
                      {s.domain}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                      background: s.mode === 'online' ? theme.colors.info + '18' : s.mode === 'offline' ? theme.colors.success + '18' : theme.colors.warning + '18',
                      color: s.mode === 'online' ? theme.colors.info : s.mode === 'offline' ? theme.colors.success : theme.colors.warning
                    }}>
                      {s.mode}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button onClick={() => handleEditOpen(s)} style={{ background: 'transparent', border: 'none', color: theme.colors.info, cursor: 'pointer', padding: 4 }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} style={{ background: 'transparent', border: 'none', color: theme.colors.danger, cursor: 'pointer', padding: 4 }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          {/* Overlay */}
          <div onClick={() => setModalOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
          
          {/* Modal Container */}
          <GlassCard style={{ position: 'relative', width: '100%', maxWidth: 500, padding: 30, zIndex: 1 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.colors.text, marginBottom: 20 }}>
              {editId ? 'Edit Student Details' : 'Register New Student'}
            </h3>
            
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>Full Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formName} 
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>Email Address *</label>
                  <input 
                    type="email" 
                    required
                    value={formEmail} 
                    onChange={(e) => setFormEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
                  />
                </div>

                {/* Semester & Mode (2 Cols) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>Semester</label>
                    <select 
                      value={formSemester} 
                      onChange={(e) => setFormSemester(e.target.value)}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
                    >
                      {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>Study Mode</label>
                    <select 
                      value={formMode} 
                      onChange={(e) => setFormMode(e.target.value)}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                {/* Domain & City (2 Cols) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>Domain</label>
                    <select 
                      value={formDomain} 
                      onChange={(e) => setFormDomain(e.target.value)}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
                    >
                      {domains.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>City *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Mumbai"
                      value={formCity} 
                      onChange={(e) => setFormCity(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <Button type="button" onClick={() => setModalOpen(false)} variant="secondary" size="medium">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} variant="primary" size="medium">
                  {submitting ? 'Saving...' : 'Save Student'}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </AppLayout>
  );
}

export default Students;

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Plus, Trash2, Coins, Calculator, FileSpreadsheet, 
  Calendar, RefreshCw
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import { useTheme } from '../theme/ThemeContext';
import API_URL from '../config/api';

function SalarySheets() {
  const { theme } = useTheme();
  const token = localStorage.getItem('token');

  // Data states
  const [employees, setEmployees] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [month, setMonth] = useState('2026-06');
  const [presentDays, setPresentDays] = useState(25);
  const [absentDays, setAbsentDays] = useState(0);
  const [lateDays, setLateDays] = useState(0);
  const [tdc, setTdc] = useState(0);
  const [asic, setAsic] = useState(0);
  
  const [submitting, setSubmitting] = useState(false);

  // Stats
  const [totalPayroll, setTotalPayroll] = useState(0);
  const [avgNetSalary, setAvgNetSalary] = useState(0);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const headers = { Authorization: token };
    try {
      // 1. Fetch employees list (to get profiles & base salaries)
      const empRes = await axios.get(`${API_URL}/api/employees`, { headers });
      setEmployees(empRes.data || []);
      if (empRes.data && empRes.data.length > 0 && !selectedEmpId) {
        setSelectedEmpId(empRes.data[0].id);
      }

      // 2. Fetch salary sheets list
      const sheetsRes = await axios.get(`${API_URL}/api/salaries`, { headers });
      const sheetsData = sheetsRes.data || [];
      setSheets(sheetsData);

      // Calculations for stats
      const total = sheetsData.reduce((acc, curr) => acc + curr.netSalary, 0);
      setTotalPayroll(total);
      setAvgNetSalary(sheetsData.length > 0 ? Math.round(total / sheetsData.length) : 0);

      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch payroll data.');
    } finally {
      setLoading(false);
    }
  }, [token, selectedEmpId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Find currently selected employee profile details
  const selectedEmp = employees.find(e => e.id === parseInt(selectedEmpId));
  const baseSalary = selectedEmp?.salary || 50000;
  
  // Calculate live preview values
  const livePf = baseSalary * 0.12;
  const liveAbsentDec = (baseSalary / 30) * absentDays;
  const liveLateDec = (baseSalary / 90) * lateDays;
  const liveNetSalary = Math.max(0, Math.round((baseSalary - livePf - liveAbsentDec - liveLateDec + parseFloat(tdc || 0) + parseFloat(asic || 0)) * 100) / 100);

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmpId || !month) {
      alert('Please select an employee and a month.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        employeeProfileId: parseInt(selectedEmpId),
        month,
        presentDays: parseInt(presentDays),
        absentDays: parseInt(absentDays),
        lateDays: parseInt(lateDays),
        tdc: parseFloat(tdc || 0),
        asic: parseFloat(asic || 0)
      };

      await axios.post(`${API_URL}/api/salaries`, payload, { headers });
      fetchData();
      alert('Salary sheet generated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error occurred while saving salary sheet.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this salary record?')) return;
    try {
      await axios.delete(`${API_URL}/api/salaries/${id}`, { headers });
      fetchData();
    } catch (err) {
      alert('Failed to delete salary sheet.');
    }
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Employee Salary Sheets" 
        subtitle="Track employee work attendance, manage PF contributions, and apply TDC/ASIC compensation components."
      />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
        <StatCard title="Total Net Payroll Processed" value={`₹${totalPayroll.toLocaleString('en-IN')}`} icon={Coins} color={theme.colors.accent} />
        <StatCard title="Average Net Salary" value={`₹${avgNetSalary.toLocaleString('en-IN')}`} icon={Calculator} color={theme.colors.success} />
        <StatCard title="Generated Salary Slips" value={sheets.length} icon={FileSpreadsheet} color={theme.colors.info} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        
        {/* Payroll Form Card */}
        <GlassCard style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Calculator size={18} color={theme.colors.accent} />
            <span style={{ fontSize: 16, fontWeight: 700, color: theme.colors.text }}>Payroll Calculator & Generator</span>
            <button onClick={fetchData} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: theme.colors.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={14} /> Sync Profiles
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
              
              {/* Employee Selection */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>Select Employee Profile</label>
                <select 
                  value={selectedEmpId} 
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.designation || 'Staff'} - Base: ₹{e.salary || 50000})
                    </option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>Pay Period (Month)</label>
                <input 
                  type="month" 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)}
                  style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
                />
              </div>

              {/* Present Days */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>Present Days</label>
                <input 
                  type="number" 
                  min="0"
                  max="31"
                  required
                  value={presentDays} 
                  onChange={(e) => setPresentDays(parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
                />
              </div>

              {/* Absent Days */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>Absent Days</label>
                <input 
                  type="number" 
                  min="0"
                  max="31"
                  required
                  value={absentDays} 
                  onChange={(e) => setAbsentDays(parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
                />
              </div>

              {/* Late Days */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>Late Days</label>
                <input 
                  type="number" 
                  min="0"
                  max="31"
                  required
                  value={lateDays} 
                  onChange={(e) => setLateDays(parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              {/* TDC Component */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>TDC (Total Daily Cost / Component Allowance)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 3000"
                  value={tdc === 0 ? '' : tdc} 
                  onChange={(e) => setTdc(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
                />
              </div>

              {/* ASIC Component */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>ASIC Allowance Component</label>
                <input 
                  type="number" 
                  placeholder="e.g. 2000"
                  value={asic === 0 ? '' : asic} 
                  onChange={(e) => setAsic(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid ' + theme.colors.border, background: theme.colors.bgInput, color: theme.colors.text, fontSize: 13 }}
                />
              </div>

              {/* PF Info (Read-Only) */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>PF Contribution (12% Deduction)</label>
                <div style={{ padding: 10, borderRadius: 8, border: '1px solid ' + theme.colors.border, background: 'rgba(255,255,255,0.03)', color: theme.colors.text, fontSize: 13, fontWeight: 600 }}>
                  ₹{livePf.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Calculations Preview Pane */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid ' + theme.colors.border, marginBottom: 20, gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: 500 }}>Live Net Calculation Formula:</div>
                <div style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 4, fontFamily: 'monospace' }}>
                  ₹{baseSalary} (Base) - ₹{livePf} (PF) - ₹{liveAbsentDec.toFixed(0)} (Absent) - ₹{liveLateDec.toFixed(0)} (Late) + ₹{tdc} (TDC) + ₹{asic} (ASIC)
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>Net Salary Amount:</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: theme.colors.accent }}>₹{liveNetSalary.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" disabled={submitting} variant="primary" size="medium" icon={Plus}>
                {submitting ? 'Generating...' : 'Generate & Save Salary Sheet'}
              </Button>
            </div>
          </form>
        </GlassCard>

        {/* Salary Sheet History Table */}
        <GlassCard style={{ padding: 0 }}>
          <div style={{ padding: 24, borderBottom: '1px solid ' + theme.colors.border }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: theme.colors.text }}>Salary Sheets Archive</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: theme.colors.textSecondary }}>Loading salary sheets archive...</div>
            ) : error ? (
              <div style={{ padding: 40, textAlign: 'center', color: theme.colors.danger }}>{error}</div>
            ) : sheets.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: theme.colors.textSecondary }}>No salary sheets have been generated yet.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid ' + theme.colors.border, background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: theme.colors.textSecondary }}>Employee</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: theme.colors.textSecondary }}>Department</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: theme.colors.textSecondary }}>Month</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: theme.colors.textSecondary }}>Attendance (P/A/L)</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: theme.colors.textSecondary }}>Base Salary</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: theme.colors.textSecondary }}>PF (12%)</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: theme.colors.textSecondary }}>TDC / ASIC</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: theme.colors.textSecondary }}>Net Salary</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: theme.colors.textSecondary, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sheets.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid ' + theme.colors.border, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 600, color: theme.colors.text }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>{s.email}</div>
                      </td>
                      <td style={{ padding: '16px 20px', color: theme.colors.text }}>
                        <div>{s.department}</div>
                        <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>{s.designation}</div>
                      </td>
                      <td style={{ padding: '16px 20px', color: theme.colors.text }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={13} color={theme.colors.accent} /> {s.month}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', color: theme.colors.text }}>
                        <span style={{ color: theme.colors.success, fontWeight: 600 }}>{s.presentDays}</span> / <span style={{ color: theme.colors.danger, fontWeight: 600 }}>{s.absentDays}</span> / <span style={{ color: theme.colors.warning, fontWeight: 600 }}>{s.lateDays}</span>
                      </td>
                      <td style={{ padding: '16px 20px', color: theme.colors.text }}>₹{s.baseSalary.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '16px 20px', color: theme.colors.text }}>₹{s.pf.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '16px 20px', color: theme.colors.text }}>
                        <div style={{ fontSize: 12 }}>TDC: +₹{s.tdc}</div>
                        <div style={{ fontSize: 12 }}>ASIC: +₹{s.asic}</div>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: theme.colors.success }}>₹{s.netSalary.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button onClick={() => handleDelete(s.id)} style={{ background: 'transparent', border: 'none', color: theme.colors.danger, cursor: 'pointer', padding: 4 }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </GlassCard>
      </div>
    </AppLayout>
  );
}

export default SalarySheets;

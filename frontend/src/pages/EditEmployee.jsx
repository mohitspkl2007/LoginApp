import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Save, Upload, X, Check } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import { FloatingInput, FloatingSelect } from '../components/ui/FloatingInput';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../theme/ThemeContext';
import API_URL from '../config/api';

function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { theme } = useTheme();
  const [departments, setDepartments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    department_id: '',
    phone: '',
    address: '',
    designation: '',
    salary: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    Promise.all([
      axios.get(`${API_URL}/api/departments`),
      axios.get(`${API_URL}/api/skills`),
      axios.get(`${API_URL}/api/employees/${id}`, { headers: { Authorization: token } }),
    ]).then(([deptRes, skillRes, empRes]) => {
      setDepartments(deptRes.data);
      setSkills(skillRes.data);
      const emp = empRes.data.employee || empRes.data;
      setForm({
        department_id: emp.departmentId || '',
        phone: emp.phone || '',
        address: emp.address || '',
        designation: emp.designation || '',
        salary: emp.salary || '',
      });
      
      // Match skill names (string list) to skill IDs
      const mappedSkills = (emp.skills || []).map(name => {
        const found = skillRes.data.find(s => s.skill_name === name);
        return found ? found.id : null;
      }).filter(Boolean);
      setSelectedSkills(mappedSkills);

      setExistingImages(emp.profileImage ? [emp.profileImage] : []);
    }).catch(console.error).finally(() => setFetching(false));
  }, [id]);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSkillToggle = (skillId) => {
    setSelectedSkills(prev =>
      prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]
    );
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeNewImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.department_id) {
      toast.warning('Please select a department');
      return;
    }
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API_URL}/api/employees/${id}`, {
        ...form,
        skill_ids: selectedSkills,
      }, { headers: { Authorization: token } });

      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(img => formData.append('images', img));
        await axios.post(`${API_URL}/api/employees/upload/${id}`, formData, {
          headers: { Authorization: token, 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success('Employee updated successfully!');
      setTimeout(() => navigate('/employees'), 800);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <AppLayout>
      <div style={{ padding: 40, textAlign: 'center' }}>Loading employee data...</div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <PageHeader
        title="Edit Employee"
        subtitle="Update employee details"
      />

      <GlassCard style={{ padding: 32, maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <FloatingSelect
            label="Department"
            value={form.department_id}
            onChange={e => updateForm('department_id', e.target.value)}
            required
          >
            <option value="">Select Department</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.department_name}</option>
            ))}
          </FloatingSelect>

          <FloatingInput
            label="Phone Number"
            value={form.phone}
            onChange={e => updateForm('phone', e.target.value)}
          />
          <FloatingInput
            label="Address"
            value={form.address}
            onChange={e => updateForm('address', e.target.value)}
          />
          <FloatingInput
            label="Designation"
            value={form.designation}
            onChange={e => updateForm('designation', e.target.value)}
            required
          />
          <FloatingInput
            label="Salary (₹)"
            type="number"
            value={form.salary}
            onChange={e => updateForm('salary', e.target.value)}
            required
          />

          {/* Skills */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: theme.colors.textMuted, marginBottom: 12,
            }}>Skills</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {skills.map(s => {
                const selected = selectedSkills.includes(s.id);
                return (
                  <button key={s.id} type="button" onClick={() => handleSkillToggle(s.id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 20,
                      border: `1.5px solid ${selected ? theme.colors.accent : theme.colors.border}`,
                      background: selected ? `${theme.colors.accent}18` : 'transparent',
                      color: selected ? theme.colors.accent : theme.colors.text,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.2s',
                    }}>
                    {selected && <Check size={14} />}
                    {s.skill_name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                color: theme.colors.textMuted, marginBottom: 12,
              }}>Current Profile Images</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {existingImages.map((img, i) => (
                  <img key={i}
                    src={`${API_URL}/uploads/${img}`}
                    alt={`Employee ${i + 1}`}
                    style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', border: `2px solid ${theme.colors.border}` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upload New Images */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: theme.colors.textMuted, marginBottom: 12,
            }}>Upload New Images (max 5)</label>
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: 24, borderRadius: 12,
              border: `2px dashed ${theme.colors.border}`,
              cursor: 'pointer', color: theme.colors.textSecondary,
              fontSize: 14, transition: 'border-color 0.2s',
            }}>
              <Upload size={20} />
              Click to upload new images
              <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
            {previews.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
                {previews.map((src, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={src} alt={`Preview ${i + 1}`}
                      style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', border: `2px solid ${theme.colors.border}` }}
                    />
                    <button type="button" onClick={() => removeNewImage(i)}
                      style={{
                        position: 'absolute', top: -6, right: -6,
                        width: 22, height: 22, borderRadius: '50%',
                        background: theme.colors.danger, border: 'none',
                        color: '#fff', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="ghost" onClick={() => navigate('/employees')} fullWidth>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={Save} disabled={loading} fullWidth>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </GlassCard>
    </AppLayout>
  );
}

export default EditEmployee;

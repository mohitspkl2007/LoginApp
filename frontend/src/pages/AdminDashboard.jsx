import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Shield, Users } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import ConfirmModal from '../components/ui/ConfirmModal';
import StatCard from '../components/ui/StatCard';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../theme/ThemeContext';
import useAuth from '../hooks/useAuth';
import API_URL from '../config/api';

function AdminDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: token },
      });
      setUsers(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Access denied. Admins only.');
        navigate('/dashboard');
      } else {
        toast.error('Failed to load users');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/api/admin/users/${deleteId}`, {
        headers: { Authorization: token },
      });
      toast.success('User deleted successfully');
      setDeleteId(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API_URL}/api/admin/users/${userId}/role`, { role: newRole }, {
        headers: { Authorization: token },
      });
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const employeeCount = users.filter(u => u.role !== 'admin').length;
  const roles = [...new Set(users.map(u => u.role).filter(Boolean))];

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={row.name} size={36} />
          <div>
            <div style={{ fontWeight: 600 }}>{row.name}</div>
            <div style={{ fontSize: 12, color: theme.colors.textMuted }}>#{row.id}</div>
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role (Inline Edit)',
      render: (row) => (
        <select
          value={row.role}
          onChange={(e) => handleRoleChange(row.id, e.target.value)}
          disabled={row.id === currentUser?.id}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${theme.colors.border}`,
            padding: '6px 10px',
            borderRadius: 8,
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: 13,
            outline: 'none',
            cursor: row.id === currentUser?.id ? 'not-allowed' : 'pointer',
            opacity: row.id === currentUser?.id ? 0.6 : 1,
            fontWeight: 600
          }}
        >
          <option value="employee" style={{ background: theme.colors.bg }}>employee</option>
          <option value="manager" style={{ background: theme.colors.bg }}>manager</option>
          <option value="hr" style={{ background: theme.colors.bg }}>hr</option>
          <option value="admin" style={{ background: theme.colors.bg }}>admin</option>
        </select>
      ),
    },
  ];

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Admin Panel" subtitle="System administration" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 28 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 120, borderRadius: 16, background: theme.colors.glass }} />
          ))}
        </div>
        <TableSkeleton rows={5} cols={3} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Admin Panel"
        subtitle="Manage system users and access control"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 28 }}>
        <StatCard title="Total Users" value={users.length} icon={Users} color={theme.colors.blue} />
        <StatCard title="Administrators" value={adminCount} icon={Shield} color={theme.colors.accent} />
        <StatCard title="Other Roles" value={employeeCount} icon={Users} color={theme.colors.chart4} />
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchKeys={['name', 'email', 'role']}
        filterKey="role"
        filterOptions={roles}
        emptyMessage="No users found"
        actions={(row) => (
          row.id !== currentUser?.id ? (
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setDeleteId(row.id)}
            >
              Delete
            </Button>
          ) : (
            <span style={{ fontSize: 12, color: theme.colors.textMuted, fontStyle: 'italic', paddingRight: 8 }}>Active Admin</span>
          )
        )}
      />

      <ConfirmModal
        open={!!deleteId}
        title="Delete User"
        message="This will permanently remove the user account and all associated data. This action cannot be undone."
        confirmLabel="Delete User"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AppLayout>
  );
}

export default AdminDashboard;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Pencil, Trash2 } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import ConfirmModal from '../components/ui/ConfirmModal';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import API_URL from '../config/api';

function EmployeeList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { // eslint-disable-line
    fetchEmployees();
  }, []); // eslint-disable-line

  const fetchEmployees = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/api/employees`, {
        headers: { Authorization: token },
      });
      setEmployees(res.data);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/api/employees/${deleteId}`, {
        headers: { Authorization: token },
      });
      toast.success('Employee deleted successfully');
      setDeleteId(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const departments = [...new Set(employees.map(e => e.department_name).filter(Boolean))];

  const columns = [
    {
      key: 'name',
      label: 'Employee',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={row.name} size={36} src={row.profileImage ? `${API_URL}/uploads/${row.profileImage}` : null} />
          <div>
            <div style={{ fontWeight: 600 }}>{row.name}</div>
            <div style={{ fontSize: 12, color: '#8b93a8' }}>#{row.id}</div>
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'department_name',
      label: 'Department',
      render: (row) => <Badge variant="default">{row.department_name || '—'}</Badge>,
    },
    { key: 'designation', label: 'Designation' },
    {
      key: 'salary',
      label: 'Salary',
      render: (row) => <span style={{ fontWeight: 600 }}>₹{Number(row.salary).toLocaleString('en-IN')}</span>,
    },
  ];

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Employees" subtitle="Manage your workforce" />
        <TableSkeleton rows={6} cols={5} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} team members across your organization`}
        actions={
          <Button variant="primary" icon={UserPlus} onClick={() => navigate('/employees/create')}>
            Add Employee
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={employees}
        searchKeys={['name', 'email', 'designation', 'department_name']}
        filterKey="department_name"
        filterOptions={departments}
        emptyMessage="No employees yet. Add your first team member!"
        actions={(row) => (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={Pencil}
              onClick={() => navigate(`/employees/edit/${row.id}`)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setDeleteId(row.id)}
            >
              Delete
            </Button>
          </div>
        )}
      />

      <ConfirmModal
        open={!!deleteId}
        title="Delete Employee"
        message="This action cannot be undone. The employee record and associated data will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AppLayout>
  );
}

export default EmployeeList;

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Dashboard from '../pages/Dashboard.jsx';
import AdminDashboard from '../pages/AdminDashboard';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';
import EmployeeList from '../pages/EmployeeList';
import CreateEmployee from '../pages/CreateEmployee';
import ApplyLeave from '../pages/ApplyLeave';
import MyLeaves from '../pages/MyLeaves';
import LeaveApproval from '../pages/LeaveApproval';
import ProtectedRoute from './ProtectedRoute';
import EditEmployee from '../pages/EditEmployee';
import Assets from '../pages/Assets';
import Reports from '../pages/Reports';
import AddAsset from '../pages/AddAsset';
import Students from '../pages/Students';
import SalarySheets from '../pages/SalarySheets';
import SalaryReports from '../pages/SalaryReports';
import Attendance from '../pages/Attendance';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><EmployeeList /></ProtectedRoute>} />
      <Route path="/employees/edit/:id" element={<ProtectedRoute><EditEmployee /></ProtectedRoute>} />
      <Route path="/employees/create" element={<ProtectedRoute><CreateEmployee /></ProtectedRoute>} />
      <Route path="/leave/apply" element={<ProtectedRoute><ApplyLeave /></ProtectedRoute>} />
      <Route path="/leave/my" element={<ProtectedRoute><MyLeaves /></ProtectedRoute>} />
      <Route path="/leave/approval" element={<ProtectedRoute><LeaveApproval /></ProtectedRoute>} />
      <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
      <Route path="/assets/add" element={<ProtectedRoute><AddAsset /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/assets/edit/:id" element={<ProtectedRoute><AddAsset /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
      <Route path="/salaries" element={<ProtectedRoute><SalarySheets /></ProtectedRoute>} />
      <Route path="/salary-reports" element={<ProtectedRoute><SalaryReports /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
    </Routes>
  );
}

export default AppRoutes;

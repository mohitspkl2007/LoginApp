const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const passwordRoutes = require('./routes/password');
const adminRoutes = require('./routes/admin');
const departmentRoutes = require('./routes/departments');
const skillRoutes = require('./routes/skills');
const employeeRoutes = require('./routes/employees');
const leaveRoutes = require('./routes/leave');
const errorHandler = require('./src/middleware/errorHandler');
const assetRoutes = require('./src/routes/assetRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const auditRoutes = require('./src/routes/auditRoutes');
const studentRoutes = require('./routes/student');
const salaryRoutes = require('./routes/salary');
const attendanceRoutes = require('./routes/attendance');

const app = express();

// Security
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  validate: {xForwardedForHeader: false},
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500
});
app.use(limiter);

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth', passwordRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught error:', err.message);
});
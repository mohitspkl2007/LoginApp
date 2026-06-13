const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const createNotification = require('../src/utils/notificationHelper');
const nodemailer = require('nodemailer');

const mapLeave = (l) => ({
  ...l,
  from_date: l.startDate,
  to_date: l.endDate,
  leave_type_id: l.leaveTypeId,
  user_id: l.userId,
  leave_name: l.leaveType?.name || '',
  employee_name: l.user?.name || '',
  days: l.days,
  total_days: l.days,
});

const approveLeave = async (req, res) => {
  const status = req.body.status || req.body.action;
  const comments = req.body.comments || req.body.remarks || '';
  try {
    const leave = await prisma.leaveRequest.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
      include: {
        user: true,
        leaveType: true
      }
    });

    console.log("Leave status updated to approved or rejected");

    await prisma.leaveApproval.create({
      data: {
        leaveRequestId: parseInt(req.params.id),
        approverId: req.user.id,
        approverRole: req.user.role,
        status,
        comments,
      }
    });

    if (status === 'approved') {
      const year = new Date(leave.startDate).getFullYear();
      const balance = await prisma.leaveBalance.findFirst({
        where: { userId: leave.userId, leaveTypeId: leave.leaveTypeId, year }
      });
      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { usedDays: { increment: leave.days } }
        });
      } else {
        await prisma.leaveBalance.create({
          data: {
            userId: leave.userId,
            leaveTypeId: leave.leaveTypeId,
            year,
            totalDays: leave.leaveType.maxDays,
            usedDays: leave.days
          }
        });
      }
    }

    await createNotification({
      userId: leave.userId,
      title: `Leave ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your leave request has been ${status}.${comments ? ' Comment: ' + comments : ''}`,
    });

    // Send email notification to employee
    try {
      console.log("Sending email to " + leave.user.email);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: leave.user.email,
        subject: `Leave Request ${status.toUpperCase()} - Mohit Sapkal HRMS`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333; line-height: 1.6; max-width: 600px; border-radius: 8px; border: 1px solid #ddd;">
            <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 8px;">Leave Request Processed</h2>
            <p>Hello <strong>${leave.user.name}</strong>,</p>
            <p>Your leave request has been reviewed. Here are the details:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px;">
              <tr style="background-color: #f2f2f2;"><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 35%;">Leave Type</td><td style="padding: 10px; border: 1px solid #ddd;">${leave.leaveType?.name || 'General Leave'}</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Start Date</td><td style="padding: 10px; border: 1px solid #ddd;">${new Date(leave.startDate).toLocaleDateString()}</td></tr>
              <tr style="background-color: #f2f2f2;"><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">End Date</td><td style="padding: 10px; border: 1px solid #ddd;">${new Date(leave.endDate).toLocaleDateString()}</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Total Days</td><td style="padding: 10px; border: 1px solid #ddd;">${leave.days} day(s)</td></tr>
              <tr style="background-color: #f2f2f2;"><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Status</td><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: ${status === 'approved' ? '#10b981' : '#ef4444'}; text-transform: uppercase;">${status}</td></tr>
              ${status === 'rejected' ? `<tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Comments</td><td style="padding: 10px; border: 1px solid #ddd;">${comments || 'No comments specified.'}</td></tr>` : ''}
            </table>
            <p>If you have any questions, please contact your manager or human resources.</p>
            <p style="margin-top: 25px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 10px;">Best Regards,<br/><strong>Mohit Sapkal HRMS Team</strong></p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully");
    } catch (emailError) {
      console.log("Email failed to send " + emailError.message);
    }

    res.json({ message: `Leave ${status}!`, leave });
  } catch (err) {
    console.error('APPROVE ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET leave types - PUBLIC
router.get('/types', async (req, res) => {
  try {
    const types = await prisma.leaveType.findMany();
    res.json(types.map(t => ({ id: t.id, leave_name: t.name, max_days: t.maxDays })));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET leave balance
router.get('/balance', auth, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    let balances = await prisma.leaveBalance.findMany({
      where: { userId: req.user.id, year },
    });
    
    // Fetch all leave types to map names
    const types = await prisma.leaveType.findMany();
    
    // Self-healing: if balance entries are missing, initialize them automatically
    if (balances.length < types.length) {
      for (const t of types) {
        const hasBalance = balances.some(b => b.leaveTypeId === t.id);
        if (!hasBalance) {
          await prisma.leaveBalance.create({
            data: {
              userId: req.user.id,
              leaveTypeId: t.id,
              year,
              totalDays: t.maxDays,
              usedDays: 0
            }
          });
        }
      }
      // Re-fetch balances after creation
      balances = await prisma.leaveBalance.findMany({
        where: { userId: req.user.id, year },
      });
    }
    
    const mapped = balances.map(b => {
      const type = types.find(t => t.id === b.leaveTypeId);
      return {
        id: b.id,
        leave_type_id: b.leaveTypeId,
        leave_name: type ? type.name : 'General Leave',
        available_days: Math.max(0, b.totalDays - b.usedDays),
        total_days: b.totalDays,
        used_days: b.usedDays
      };
    });
    
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST apply leave
router.post('/apply', auth, async (req, res) => {
  const { leave_type_id, from_date, to_date, reason } = req.body;
  try {
    const start = new Date(from_date);
    const end = new Date(to_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const request = await prisma.leaveRequest.create({
      data: {
        userId: req.user.id,
        leaveTypeId: parseInt(leave_type_id),
        startDate: start,
        endDate: end,
        days,
        reason,
        status: 'pending',
      },
      include: { leaveType: true },
    });
    await createNotification({
      userId: req.user.id,
      title: 'Leave Request Submitted',
      message: `Your leave request for ${days} day(s) has been submitted.`,
    });
    res.status(201).json({ message: 'Leave applied!', request: mapLeave(request) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET my leaves
router.get('/my', auth, async (req, res) => {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      where: { userId: req.user.id },
      include: { leaveType: true, approvals: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(leaves.map(mapLeave));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET all leaves
router.get('/all', auth, async (req, res) => {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        leaveType: true,
        approvals: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(leaves.map(mapLeave));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT approve/reject routes
router.put('/:id/approve', auth, authorize('admin', 'hr', 'manager'), approveLeave);
router.put('/action/:id', auth, authorize('admin', 'hr', 'manager'), approveLeave);

module.exports = router;

// GET leave stats
router.get('/stats', auth, async (req, res) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      prisma.leaveRequest.count({ where: { status: 'pending' } }),
      prisma.leaveRequest.count({ where: { status: 'approved' } }),
      prisma.leaveRequest.count({ where: { status: 'rejected' } }),
      prisma.leaveRequest.count(),
    ]);
    res.json({ pending, approved, rejected, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET leave type breakdown
router.get('/stats/by-type', auth, async (req, res) => {
  try {
    const types = await prisma.leaveType.findMany({
      include: { leaveRequests: true },
    });
    const data = types.map(t => ({
      name: t.name,
      value: t.leaveRequests.length,
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

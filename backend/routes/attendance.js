const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Helper to normalize date to midnight local time
const getNormalizedDate = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// 1. GET /api/attendance/today - Get today's attendance status for logged-in employee
router.get('/today', auth, async (req, res) => {
  try {
    const today = getNormalizedDate();
    const record = await prisma.attendance.findFirst({
      where: {
        employeeId: req.user.id,
        date: today
      }
    });
    res.json(record);
  } catch (err) {
    console.error('GET TODAY ATTENDANCE ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 2. GET /api/attendance/my-history - Employee's own attendance history
router.get('/my-history', auth, async (req, res) => {
  try {
    const list = await prisma.attendance.findMany({
      where: { employeeId: req.user.id },
      orderBy: { date: 'desc' }
    });
    res.json(list);
  } catch (err) {
    console.error('GET MY HISTORY ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 3. POST /api/attendance/checkin - Employee checks in
router.post('/checkin', auth, async (req, res) => {
  try {
    const today = getNormalizedDate();
    const now = new Date();

    // Check if check-in already exists for today
    let record = await prisma.attendance.findFirst({
      where: {
        employeeId: req.user.id,
        date: today
      }
    });

    if (record && record.checkInTime) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    // Determine status (Present or Late)
    // Late if check-in is after 10:00 AM
    let status = 'Present';
    if (now.getHours() >= 10) {
      status = 'Late';
    }

    if (record) {
      record = await prisma.attendance.update({
        where: { id: record.id },
        data: {
          checkInTime: now,
          status,
          location: req.body.location || 'Office'
        }
      });
    } else {
      record = await prisma.attendance.create({
        data: {
          employeeId: req.user.id,
          date: today,
          checkInTime: now,
          status,
          location: req.body.location || 'Office'
        }
      });
    }

    res.status(201).json({ message: 'Checked in successfully', record });
  } catch (err) {
    console.error('CHECKIN ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 4. POST /api/attendance/checkout - Employee checks out
router.post('/checkout', auth, async (req, res) => {
  try {
    const today = getNormalizedDate();
    const now = new Date();

    let record = await prisma.attendance.findFirst({
      where: {
        employeeId: req.user.id,
        date: today
      }
    });

    if (!record || !record.checkInTime) {
      return res.status(400).json({ message: 'You must check in first' });
    }

    if (record.checkOutTime) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    // Calculate working hours
    const diffMs = now - new Date(record.checkInTime);
    const workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    // Determine status (Present, Late, or Half-day)
    let status = record.status;
    if (workingHours < 4) {
      status = 'Half-day';
    }

    record = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOutTime: now,
        workingHours,
        status
      }
    });

    res.json({ message: 'Checked out successfully', record });
  } catch (err) {
    console.error('CHECKOUT ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 5. GET /api/attendance/all - Admin and HR view all employees attendance
router.get('/all', auth, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const list = await prisma.attendance.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeProfile: {
              select: {
                designation: true,
                department: { select: { departmentName: true } }
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    const mapped = list.map(a => ({
      id: a.id,
      employeeId: a.employeeId,
      userId: a.employeeId, // backward compatibility
      name: a.employee?.name || 'Unknown',
      email: a.employee?.email || '',
      designation: a.employee?.employeeProfile?.designation || '',
      department: a.employee?.employeeProfile?.department?.departmentName || '',
      date: a.date,
      status: a.status,
      checkInTime: a.checkInTime,
      checkOutTime: a.checkOutTime,
      workingHours: a.workingHours,
      location: a.location
    }));

    res.json(mapped);
  } catch (err) {
    console.error('GET ALL ATTENDANCE ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 6. GET /api/attendance/report/:employeeId - Admin gets specific employee report
router.get('/report/:employeeId', auth, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const empId = parseInt(req.params.employeeId);
    const list = await prisma.attendance.findMany({
      where: { employeeId: empId },
      orderBy: { date: 'desc' }
    });
    res.json(list);
  } catch (err) {
    console.error('GET REPORT ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 7. POST /api/attendance/mark - Admin and HR manual marking
router.post('/mark', auth, authorize('admin', 'hr'), async (req, res) => {
  const { employeeId, date, status, checkInTime, checkOutTime, location } = req.body;

  if (!employeeId || !date) {
    return res.status(400).json({ message: 'Employee ID and Date are required' });
  }

  try {
    const userExists = await prisma.user.findUnique({
      where: { id: parseInt(employeeId) }
    });
    if (!userExists) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const attendanceDate = getNormalizedDate(date);

    // Calculate working hours if checkInTime and checkOutTime are provided
    let workingHours = null;
    let checkInDate = checkInTime ? new Date(checkInTime) : null;
    let checkOutDate = checkOutTime ? new Date(checkOutTime) : null;
    
    if (checkInDate && checkOutDate) {
      const diffMs = checkOutDate - checkInDate;
      workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    }

    const existingRecord = await prisma.attendance.findFirst({
      where: {
        employeeId: parseInt(employeeId),
        date: attendanceDate
      }
    });

    let attendanceRecord;

    if (existingRecord) {
      attendanceRecord = await prisma.attendance.update({
        where: { id: existingRecord.id },
        data: {
          status: status || 'Present',
          checkInTime: checkInDate,
          checkOutTime: checkOutDate,
          workingHours,
          location: location || 'Office'
        }
      });
    } else {
      attendanceRecord = await prisma.attendance.create({
        data: {
          employeeId: parseInt(employeeId),
          date: attendanceDate,
          status: status || 'Present',
          checkInTime: checkInDate,
          checkOutTime: checkOutDate,
          workingHours,
          location: location || 'Office'
        }
      });
    }

    res.status(201).json({ message: 'Attendance marked successfully', attendance: attendanceRecord });
  } catch (err) {
    console.error('MARK ATTENDANCE ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 8. PUT /api/attendance/:id - Admin and HR manual update
router.put('/:id', auth, authorize('admin', 'hr'), async (req, res) => {
  const { status, checkInTime, checkOutTime, location } = req.body;

  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.attendance.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    let checkInDate = checkInTime ? new Date(checkInTime) : existing.checkInTime;
    let checkOutDate = checkOutTime ? new Date(checkOutTime) : existing.checkOutTime;
    let workingHours = existing.workingHours;

    if (checkInDate && checkOutDate) {
      const diffMs = new Date(checkOutDate) - new Date(checkInDate);
      workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        status: status || existing.status,
        checkInTime: checkInDate,
        checkOutTime: checkOutDate,
        workingHours,
        location: location || existing.location
      }
    });

    res.json({ message: 'Attendance record updated successfully', attendance: updated });
  } catch (err) {
    console.error('UPDATE ATTENDANCE ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

// 1. POST - Save or update salary sheet for an employee
router.post('/', auth, async (req, res) => {
  const { employeeProfileId, month, presentDays, absentDays, lateDays, tdc, asic } = req.body;

  if (!employeeProfileId || !month || presentDays === undefined || absentDays === undefined || lateDays === undefined) {
    return res.status(400).json({ message: 'Missing required payroll fields' });
  }

  try {
    const profile = await prisma.employeeProfile.findUnique({
      where: { id: parseInt(employeeProfileId) }
    });

    if (!profile) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const baseSalary = profile.salary || 50000;
    const pf = baseSalary * 0.12;
    const absentDeduction = (baseSalary / 30) * parseInt(absentDays);
    const lateDeduction = (baseSalary / 90) * parseInt(lateDays);

    const tdcVal = parseFloat(tdc || 0);
    const asicVal = parseFloat(asic || 0);

    const rawNet = baseSalary - pf - absentDeduction - lateDeduction + tdcVal + asicVal;
    const netSalary = Math.max(0, Math.round(rawNet * 100) / 100);

    const salarySheet = await prisma.salarySheet.upsert({
      where: {
        employeeProfileId_month: {
          employeeProfileId: parseInt(employeeProfileId),
          month
        }
      },
      update: {
        presentDays: parseInt(presentDays),
        absentDays: parseInt(absentDays),
        lateDays: parseInt(lateDays),
        tdc: tdcVal,
        asic: asicVal,
        pf,
        netSalary
      },
      create: {
        employeeProfileId: parseInt(employeeProfileId),
        month,
        presentDays: parseInt(presentDays),
        absentDays: parseInt(absentDays),
        lateDays: parseInt(lateDays),
        tdc: tdcVal,
        asic: asicVal,
        pf,
        netSalary
      }
    });

    res.status(201).json({ message: 'Salary sheet generated successfully', salarySheet });
  } catch (error) {
    console.error('SAVE SALARY SHEET ERROR:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 2. GET - List all salary sheets
router.get('/', auth, async (req, res) => {
  try {
    const sheets = await prisma.salarySheet.findMany({
      include: {
        employeeProfile: {
          include: {
            user: { select: { name: true, email: true } },
            department: { select: { departmentName: true } }
          }
        }
      },
      orderBy: [
        { month: 'desc' },
        { employeeProfile: { user: { name: 'asc' } } }
      ]
    });

    const mapped = sheets.map(s => ({
      id: s.id,
      employeeProfileId: s.employeeProfileId,
      name: s.employeeProfile.user?.name || 'Unknown',
      email: s.employeeProfile.user?.email || '',
      department: s.employeeProfile.department?.departmentName || 'General',
      designation: s.employeeProfile.designation || '',
      month: s.month,
      presentDays: s.presentDays,
      absentDays: s.absentDays,
      lateDays: s.lateDays,
      baseSalary: s.employeeProfile.salary || 50000,
      tdc: s.tdc,
      asic: s.asic,
      pf: s.pf,
      netSalary: s.netSalary,
      createdAt: s.createdAt
    }));

    res.json(mapped);
  } catch (error) {
    console.error('GET SALARY SHEETS ERROR:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 3. DELETE - Delete salary sheet
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.salarySheet.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Salary sheet deleted successfully' });
  } catch (error) {
    console.error('DELETE SALARY SHEET ERROR:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 4. GET - Stats for reports
router.get('/stats', auth, async (req, res) => {
  try {
    const sheets = await prisma.salarySheet.findMany({
      include: {
        employeeProfile: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });

    // 1. Monthly Total Salaries (June 2026, May 2026, etc.)
    const monthTotals = {};
    sheets.forEach(s => {
      monthTotals[s.month] = (monthTotals[s.month] || 0) + s.netSalary;
    });
    const salaryTrendData = Object.entries(monthTotals).map(([month, total]) => ({ month, total }));

    // 2. Base vs Net salary breakdown (latest month)
    // Find latest month
    const months = [...new Set(sheets.map(s => s.month))].sort().reverse();
    const latestMonth = months[0] || '2026-06';
    const latestSheets = sheets.filter(s => s.month === latestMonth);

    const baseVsNetData = latestSheets.map(s => ({
      name: s.employeeProfile.user?.name || 'Employee',
      base: s.employeeProfile.salary || 50000,
      net: s.netSalary
    }));

    // 3. Attendance vs Salary scatter (Present days vs Net Salary)
    const attendanceVsSalaryData = sheets.map(s => ({
      name: s.employeeProfile.user?.name || 'Employee',
      present: s.presentDays,
      salary: s.netSalary,
      month: s.month
    }));

    res.json({
      latestMonth,
      salaryTrendData,
      baseVsNetData,
      attendanceVsSalaryData
    });
  } catch (error) {
    console.error('GET SALARY STATS ERROR:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

// 1. POST - Create student
router.post('/', auth, async (req, res) => {
  const { name, email, semester, city, domain, mode } = req.body;
  if (!name || !email || !semester || !city || !domain || !mode) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const student = await prisma.student.create({
      data: { name, email, semester, city, domain, mode }
    });
    res.status(201).json({ message: 'Student registered successfully', student });
  } catch (error) {
    console.error('CREATE STUDENT ERROR:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 2. GET - List students with filter and search
router.get('/', auth, async (req, res) => {
  const { search, semester, city, domain, mode } = req.query;

  try {
    const where = {};

    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (semester && semester !== 'all') {
      where.semester = semester;
    }
    if (city && city !== 'all') {
      where.city = { contains: city, mode: 'insensitive' };
    }
    if (domain && domain !== 'all') {
      where.domain = domain;
    }
    if (mode && mode !== 'all') {
      where.mode = mode;
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(students);
  } catch (error) {
    console.error('GET STUDENTS ERROR:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 3. GET - Stats for student charts
router.get('/stats', auth, async (req, res) => {
  try {
    const students = await prisma.student.findMany();

    const totalStudents = students.length;

    // Mode Distribution
    const modeCounts = { online: 0, offline: 0, hybrid: 0 };
    // Domain Distribution
    const domainCounts = {};
    // Semester Distribution
    const semesterCounts = {};

    students.forEach(s => {
      // Mode
      const m = s.mode.toLowerCase();
      if (modeCounts[m] !== undefined) {
        modeCounts[m]++;
      }

      // Domain
      domainCounts[s.domain] = (domainCounts[s.domain] || 0) + 1;

      // Semester
      semesterCounts[s.semester] = (semesterCounts[s.semester] || 0) + 1;
    });

    const modeData = Object.entries(modeCounts).map(([name, value]) => ({ name, value }));
    const domainData = Object.entries(domainCounts).map(([name, value]) => ({ name, value }));
    const semesterData = Object.entries(semesterCounts).map(([name, value]) => ({ name, value }));

    res.json({
      totalStudents,
      modeData,
      domainData,
      semesterData
    });
  } catch (error) {
    console.error('GET STUDENT STATS ERROR:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 4. PUT - Update student
router.put('/:id', auth, async (req, res) => {
  const { name, email, semester, city, domain, mode } = req.body;
  try {
    const studentId = parseInt(req.params.id);
    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { name, email, semester, city, domain, mode }
    });
    res.json({ message: 'Student updated successfully', student: updated });
  } catch (error) {
    console.error('UPDATE STUDENT ERROR:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 5. DELETE - Delete student
router.delete('/:id', auth, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    await prisma.student.delete({
      where: { id: studentId }
    });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('DELETE STUDENT ERROR:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage, limits: { files: 5 } });

// POST create employee
router.post('/', auth, authorize('admin', 'hr'), async (req, res) => {
  const { name, email, password, role, department_id, phone, address, designation, salary, skill_ids } = req.body;
  try {
    let userId;

    if (email) {
      // Create new user account
      const normalizedEmail = email.toLowerCase().trim();
      let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        const hashed = await bcrypt.hash(password || 'Password@123', 10);
        user = await prisma.user.create({
          data: { name, email: normalizedEmail, password: hashed, role: role || 'employee', isVerified: true }
        });
      }
      userId = user.id;
    } else {
      // Use logged in user
      userId = req.user.id;
    }

    const existing = await prisma.employeeProfile.findUnique({ where: { userId } });
    if (existing) return res.status(400).json({ message: 'Employee profile already exists for this user' });

    const skillMap = {"1":"JavaScript","2":"TypeScript","3":"React","4":"Node.js","5":"Python","6":"Java","7":"C++","8":"SQL","9":"PostgreSQL","10":"MongoDB","11":"HTML","12":"CSS","13":"Git","14":"Docker","15":"AWS","16":"REST API","17":"GraphQL","18":"Redux","19":"Next.js","20":"Express.js","21":"Prisma","22":"Figma","23":"Photoshop","24":"Excel","25":"Communication","26":"Leadership","27":"Project Management","28":"Agile","29":"Scrum"}; const ids = skill_ids ? (Array.isArray(skill_ids) ? skill_ids : [skill_ids]) : []; const skillsArray = ids.map(id => skillMap[String(id)] || String(id));

    const profile = await prisma.employeeProfile.create({
      data: {
        userId,
        departmentId: department_id ? parseInt(department_id) : null,
        phone,
        address,
        designation,
        salary: salary ? parseFloat(salary) : null,
        skills: skillsArray,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        department: true,
      }
    });

    res.status(201).json({ message: 'Employee created!', employee: { ...profile, id: profile.id } });
  } catch (err) {
    console.error('CREATE EMPLOYEE ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST upload images
router.post('/upload/:id', auth, upload.array('images', 5), async (req, res) => {
  try {
    const images = req.files ? req.files.map(f => f.filename) : [];
    if (images.length > 0) {
      await prisma.employeeProfile.update({
        where: { id: parseInt(req.params.id) },
        data: { profileImage: images[0] }
      });
    }
    res.json({ message: 'Images uploaded!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET all employees
router.get('/', auth, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const employees = await prisma.employeeProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const mapped = employees.map(e => ({
      ...e,
      name: e.user?.name,
      email: e.user?.email,
      role: e.user?.role,
      department_name: e.department?.departmentName,
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET single employee
router.get('/:id', auth, async (req, res) => {
  try {
    const profile = await prisma.employeeProfile.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        department: true,
      }
    });
    if (!profile) return res.status(404).json({ message: 'Employee not found' });
    if (req.user.role === 'employee' && req.user.id !== profile.userId) {
      return res.status(403).json({ message: 'Access Denied' });
    }
    res.json({ ...profile, name: profile.user?.name, email: profile.user?.email, department_name: profile.department?.departmentName });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT update employee
router.put('/:id', auth, authorize('admin', 'hr'), upload.array('images', 5), async (req, res) => {
  const { department_id, phone, address, designation, salary, skill_ids } = req.body;
  try {
    const skillMap = {"1":"JavaScript","2":"TypeScript","3":"React","4":"Node.js","5":"Python","6":"Java","7":"C++","8":"SQL","9":"PostgreSQL","10":"MongoDB","11":"HTML","12":"CSS","13":"Git","14":"Docker","15":"AWS","16":"REST API","17":"GraphQL","18":"Redux","19":"Next.js","20":"Express.js","21":"Prisma","22":"Figma","23":"Photoshop","24":"Excel","25":"Communication","26":"Leadership","27":"Project Management","28":"Agile","29":"Scrum"}; const ids = skill_ids ? (Array.isArray(skill_ids) ? skill_ids : [skill_ids]) : []; const skillsArray = ids.map(id => skillMap[String(id)] || String(id));
    const images = req.files ? req.files.map(f => f.filename) : [];

    const updated = await prisma.employeeProfile.update({
      where: { id: parseInt(req.params.id) },
      data: {
        departmentId: department_id ? parseInt(department_id) : null,
        phone, address, designation,
        salary: salary ? parseFloat(salary) : null,
        skills: skillsArray,
        ...(images.length > 0 && { profileImage: images[0] }),
      }
    });
    res.json({ message: 'Employee updated!', profile: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE employee
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await prisma.employeeProfile.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Employee deleted!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// GET dashboard stats
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const [totalEmployees, totalDepartments, skillsData, imagesData] = await Promise.all([
      prisma.employeeProfile.count(),
      prisma.department.count(),
      prisma.employeeProfile.findMany({ select: { skills: true } }),
      prisma.employeeProfile.findMany({ select: { profileImage: true } }),
    ]);

    const totalSkills = [...new Set(skillsData.flatMap(e => e.skills))].length;
    const totalImages = imagesData.filter(e => e.profileImage).length;

    res.json({ totalEmployees, totalDepartments, totalSkills, totalImages });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET department-wise employee count
router.get('/stats/by-department', auth, async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: { employeeProfiles: true },
    });
    const data = departments.map(d => ({
      department: d.departmentName,
      employees: d.employeeProfiles.length,
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET monthly joining trend
router.get('/stats/monthly-joining', auth, async (req, res) => {
  try {
    const profiles = await prisma.employeeProfile.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const monthMap = {};
    profiles.forEach(p => {
      const key = p.createdAt.toISOString().slice(0, 7);
      monthMap[key] = (monthMap[key] || 0) + 1;
    });
    const data = Object.entries(monthMap).map(([month, count]) => ({ month, count }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET global search
router.get('/search/global', auth, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json([]);
  try {
    const profiles = await prisma.employeeProfile.findMany({
      where: {
        OR: [
          { user: { name: { contains: q, mode: 'insensitive' } } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { department: { departmentName: { contains: q, mode: 'insensitive' } } },
          { designation: { contains: q, mode: 'insensitive' } },
          { skills: { has: q } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        department: true,
      },
      take: 10,
    });
    const results = profiles.map(p => ({
      id: p.id,
      name: p.user?.name,
      email: p.user?.email,
      role: p.user?.role,
      designation: p.designation,
      department: p.department?.departmentName,
      skills: p.skills,
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

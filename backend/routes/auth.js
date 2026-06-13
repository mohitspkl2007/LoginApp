const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

// SIGNUP
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email: normalizedEmail, password: hashed, role: role || 'employee', isVerified: true }
    });
    res.status(201).json({ message: 'Registered successfully!', user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('SIGNUP ERROR:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    console.log("LOGIN EMAIL:", normalizedEmail);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    console.log("USER FOUND:", user);
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Wrong password' });

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({ message: 'Login successful!', accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('LOGIN ERROR:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// REFRESH TOKEN
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });
  try {
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored) return res.status(403).json({ message: 'Invalid refresh token' });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
});

// LOGOUT
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  try {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    res.json({ message: 'Logged out successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

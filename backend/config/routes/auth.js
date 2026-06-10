const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// SIGNUP
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
 
  try {
    // Check if email already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to database
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully!' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.rows[0].password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Wrong password' });
    }

    // Create a token
    const token = jwt.sign(
      { id: user.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful!', token });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
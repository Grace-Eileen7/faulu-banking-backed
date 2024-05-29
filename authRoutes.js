const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

router.post('/register', async (req, res) => {
  try {
    const { accountNumber, phoneNumber, idType, idNumber, password, username} = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    await pool.query(
      'INSERT INTO users (accountNumber, phoneNumber, idType, idNumber, password, username) VALUES (?, ?, ?, ?, ?)',
      [accountNumber, phoneNumber, idType, idNumber, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

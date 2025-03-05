// auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const sessions = require('./sessions');
const crypto = require('crypto'); // used to generate session IDs

// Signup endpoint (unchanged)
router.post('/signup', (req, res) => {
  const { name, email, password, phone, dob } = req.body;
  if (!name || !email || !password || !phone || !dob) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
  db.query(checkEmailSql, [email], (err, results) => {
    if (err) {
      console.error('Error checking for existing email:', err);
      return res.status(500).json({ error: 'Error occurred during signup.' });
    }
    if (results.length > 0) {
      return res.status(400).json({ error: 'Email already in use.' });
    }
    const sql = 'INSERT INTO users (name, email, password, phone, dob) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [name, email, password, phone, dob], (err, result) => {
      if (err) {
        console.error('Error during signup:', err);
        return res.status(500).json({ error: 'Error occurred during signup.' });
      }
      res.status(201).json({ message: 'Signup successful!', userId: result.insertId });
    });
  });
});

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Error during login:', err);
      return res.status(500).json({ error: 'Error occurred during login.' });
    }
    if (results.length === 0) {
      return res.status(401).json({ error: 'User not found.' });
    }
    const user = results[0];
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid password.' });
    }
    // Generate a basic session ID (no extra security)
    const sessionId = crypto.randomBytes(16).toString('hex');
    sessions[sessionId] = user.id;
    // Return the session ID in the response (visible in frontend)
    res.json({ message: 'Login successful', userId: user.id, sessionId });
  });
});

// Fetch user profile
router.get('/profile', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: 'Unauthorized access. No valid session.' });
  }
  const userId = sessions[sessionId];
  const sql = 'SELECT id, name, email, phone, dob FROM users WHERE id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user profile:', err);
      return res.status(500).json({ error: 'Error fetching user information.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(results[0]);
  });
});

// Update user profile
router.put('/profile', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: 'Unauthorized access. No valid session.' });
  }
  const userId = sessions[sessionId];
  const { name, email, phone, dob } = req.body;
  const sql = 'UPDATE users SET name = ?, email = ?, phone = ?, dob = ? WHERE id = ?';
  db.query(sql, [name, email, phone, dob, userId], (err) => {
    if (err) {
      console.error('Error updating user information:', err);
      return res.status(500).json({ error: 'Error updating user information.' });
    }
    const selectSql = 'SELECT id, name, email, phone, dob FROM users WHERE id = ?';
    db.query(selectSql, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching updated user profile:', err);
        return res.status(500).json({ error: 'User updated but error fetching updated info.' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'User not found after update.' });
      }
      res.json({ message: 'User information updated successfully.', user: results[0] });
    });
  });
});

// Change password
router.post('/change-password', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: 'Unauthorized access. No valid session.' });
  }
  const userId = sessions[sessionId];
  const { currentPassword, newPassword } = req.body;
  const sql = 'SELECT * FROM users WHERE id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user for password change:', err);
      return res.status(500).json({ error: 'Error occurred during password change.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = results[0];
    if (user.password !== currentPassword) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    const updateSql = 'UPDATE users SET password = ? WHERE id = ?';
    db.query(updateSql, [newPassword, userId], (err) => {
      if (err) {
        console.error('Error updating password:', err);
        return res.status(500).json({ error: 'Error occurred during password change.' });
      }
      res.json({ message: 'Password changed successfully.' });
    });
  });
});

// Logout endpoint
router.post('/logout', (req, res) => {
  const sessionId = req.query.sessionId;
  if (sessionId && sessions[sessionId]) {
    delete sessions[sessionId];
  }
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
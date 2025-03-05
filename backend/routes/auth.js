// auth.js (User endpoints)
const express = require('express');
const router = express.Router();
const db = require('../db');

// Signup endpoint
router.post('/signup', (req, res) => {
  const { name, email, password, phone, dob } = req.body;

  // Validate input fields
  if (!name || !email || !password || !phone || !dob) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Check if the email already exists
  const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
  db.query(checkEmailSql, [email], (err, results) => {
    if (err) {
      console.error('Error checking for existing email:', err);
      return res.status(500).json({ error: 'Error occurred during signup.' });
    }
    if (results.length > 0) {
      return res.status(400).json({ error: 'Email already in use.' });
    }

    // Insert the new user if email does not exist
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

  // Validate input fields
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Find the user by email
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

    // Validate password (remember to hash passwords in production)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    // Set session and respond
    req.session.userId = user.id;
    res.json({ message: 'Login successful', userId: user.id });
  });
});

// Fetch user profile
router.get('/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized access. User is not logged in.' });
  }
  const sql = 'SELECT id, name, email, phone, dob FROM users WHERE id = ?';
  db.query(sql, [req.session.userId], (err, results) => {
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

// Update user profile (returns updated data for immediate display)
router.put('/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized access. User is not logged in.' });
  }
  const { name, email, phone, dob } = req.body;
  const sql = 'UPDATE users SET name = ?, email = ?, phone = ?, dob = ? WHERE id = ?';
  
  db.query(sql, [name, email, phone, dob, req.session.userId], (err) => {
    if (err) {
      console.error('Error updating user information:', err);
      return res.status(500).json({ error: 'Error updating user information.' });
    }
    // Fetch updated profile data
    const selectSql = 'SELECT id, name, email, phone, dob FROM users WHERE id = ?';
    db.query(selectSql, [req.session.userId], (err, results) => {
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
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized access. User is not logged in.' });
  }
  const { currentPassword, newPassword } = req.body;

  // Check if the current password is correct
  const sql = 'SELECT * FROM users WHERE id = ?';
  db.query(sql, [req.session.userId], (err, results) => {
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

    // Update the password
    const updateSql = 'UPDATE users SET password = ? WHERE id = ?';
    db.query(updateSql, [newPassword, req.session.userId], (err) => {
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
  req.session.destroy(err => {
    if (err) {
      console.error('Error logging out:', err);
      return res.status(500).json({ error: 'Error logging out.' });
    }
    res.json({ message: 'Logged out successfully.' });
  });
});

module.exports = router;
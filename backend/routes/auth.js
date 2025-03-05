const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/signup', (req, res) => {
    const { name, email, password, phone, dob } = req.body;

    // Validate input fields
    if (!name || !email || !password || !phone || !dob) {
        return res.status(400).send('All fields are required.');
    }

    // Check if the email already exists
    const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
    db.query(checkEmailSql, [email], (err, results) => {
        if (err) {
            console.error('Error checking for existing email:', err);
            return res.status(500).send('Error occurred during signup.');
        }
        if (results.length > 0) {
            return res.status(400).send('Email already in use.'); // Email already exists
        }

        // If email does not exist, proceed to insert the new user
        const sql = `INSERT INTO users (name, email, password, phone, dob) VALUES (?, ?, ?, ?, ?)`;
        db.query(sql, [name, email, password, phone, dob], (err) => {
            if (err) {
                console.error('Error during signup:', err);
                return res.status(500).send('Error occurred during signup.');
            }
            res.status(201).send('Signup successful!');
        });
    });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Validate input fields
    if (!email || !password) {
        return res.status(400).send('Email and password are required.');
    }

    // SQL query to find the user by email
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).send('Error occurred during login.');
        }

        // Check if user exists
        if (results.length === 0) {
            return res.status(401).send('User not found.'); // User not found
        }

        const user = results[0]; // Get the user data

        // Check if password matches (make sure to hash passwords in production)
        if (user.password !== password) {
            return res.status(401).send('Invalid password.'); // Invalid password
        }

        // Password matches, set session
        req.session.userId = user.id; // Store user ID in session
        res.send('Login successful');
    });
});

// Fetch user information
router.get('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send('Unauthorized');
    }
    const sql = `SELECT id, name, email, phone, dob FROM users WHERE id = ?`;
    db.query(sql, [req.session.userId], (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching user information.');
        }
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).send('User not found.');
        }
    });
});

// Update user information
router.put('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send('Unauthorized');
    }
    const { name, email, phone, dob } = req.body;
    const sql = `UPDATE users SET name = ?, email = ?, phone = ?, dob = ? WHERE id = ?`;
    
    db.query(sql, [name, email, phone, dob, req.session.userId], (err) => {
        if (err) {
            return res.status(500).send('Error updating user information.');
        }
        res.send('User information updated successfully.');
    });
});

router.post('/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!req.session.userId) {
        return res.status(401).send('Unauthorized');
    }

    // Check if the current password is correct
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.query(sql, [req.session.userId], (err, results) => {
        if (err) {
            console.error('Error fetching user for password change:', err);
            return res.status(500).send('Error occurred during password change.');
        }

        if (results.length === 0) {
            return res.status(404).send('User not found.');
        }

        const user = results[0];

        // Check if the current password matches
        if (user.password !== currentPassword) {
            return res.status(401).send('Current password is incorrect.');
        }

        // Update the password
        const updateSql = 'UPDATE users SET password = ? WHERE id = ?';
        db.query(updateSql, [newPassword, req.session.userId], (err) => {
            if (err) {
                console.error('Error updating password:', err);
                return res.status(500).send('Error occurred during password change.');
            }
            res.send('Password changed successfully.');
        });
    });
});

// Logout endpoint
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error logging out.');
        }
        res.send('Logged out successfully.');
    });
});

module.exports = router;
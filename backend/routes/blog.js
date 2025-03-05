const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login.html');
    }
    next();
};

// Create a new blog
router.post('/blogs', isAuthenticated, (req, res) => {
    const { title, content, visibility } = req.body;

    // Use parameterized queries to prevent SQL injection
    const sql = `INSERT INTO blogs (title, content, visibility, userId) VALUES (?, ?, ?, ?)`;
    db.query(sql, [title, content, visibility, req.session.userId], (err) => {
        if (err) {
            console.error('Error creating blog:', err); // Log the error details
            return res.status(500).send('Error occurred while creating the blog.');
        }
        // Redirect to the profile page after successful blog creation
        res.redirect('/profile.html');
    });
});

// Fetch blogs
router.get('/blogs', (req, res) => {
    const sql = `
        SELECT b.id, b.title, b.content, b.created_at, u.name AS authorName 
        FROM blogs b 
        JOIN users u ON b.userId = u.id 
        WHERE b.visibility = 'public'`;
    db.query(sql, (err, blogs) => {
        if (err) {
            res.status(500).send('Error fetching blogs.');
            return;
        }
        res.json(blogs);
    });
});

// Fetch a specific blog by ID
router.get('/blogs/:id', (req, res) => {
    const blogId = req.params.id;
    const sql = `SELECT b.id, b.title, b.content, b.created_at, u.name AS authorName FROM blogs b JOIN users u ON b.userId = u.id WHERE b.id = ?`;
    
    db.query(sql, [blogId], (err, results) => {
        if (err) {
            res.status(500).send('Error fetching blog.');
            return;
        }
        if (results.length > 0) {
            res.json(results[0]); // Send the first result
        } else {
            res.status(404).send('Blog not found.');
        }
    });
});

// Save a comment
router.post('/blogs/:id/comments', (req, res) => {
    const blogId = req.params.id;
    const { content } = req.body;

    const sql = `INSERT INTO comments (userId, blogId, content) VALUES (?, ?, ?)`;
    db.query(sql, [req.session.userId, blogId, content], (err) => {
        if (err) {
            res.status(500).send('Error saving comment.');
            return;
        }
        res.status(201).send('Comment saved successfully.');
    });
});

// Fetch comments for a specific blog
router.get('/blogs/:id/comments', (req, res) => {
    const blogId = req.params.id;
    const sql = `SELECT comments.*, users.*  
                FROM comments  
                JOIN users ON comments.userId = users.id  
                WHERE comments.blogId = ? `;
    
    db.query(sql, [blogId], (err, comments) => {
        if (err) {
            res.status(500).send('Error fetching comments.');
            return;
        }
        res.json(comments);
    });
});

// Fetch user's blogs
router.get('/users/:userId/blogs', (req, res) => {
    // Ensure the user is authenticated
    if (!req.session.userId) {
        return res.status(401).send('Unauthorized');
    }

    const userId = req.session.userId;
    const sql = 'SELECT id, title, content, created_at FROM blogs WHERE userId = ?';

    db.query(sql, [userId], (err, blogs) => {
        if (err) {
            console.error('Error fetching user blogs:', err);
            return res.status(500).send('Error fetching blogs.');
        }
        res.json(blogs); // Send the blogs as JSON response
    });
});

module.exports = router;
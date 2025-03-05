// blog.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const sessions = require('./sessions');

// Create a new blog
router.post('/blogs', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: 'Unauthorized access. No valid session.' });
  }
  const userId = sessions[sessionId];
  const { title, content, visibility } = req.body;
  const sql = `INSERT INTO blogs (title, content, visibility, userId) VALUES (?, ?, ?, ?)`;
  db.query(sql, [title, content, visibility, userId], (err, result) => {
    if (err) {
      console.error('Error creating blog:', err);
      return res.status(500).json({ error: 'Error occurred while creating the blog.' });
    }
    res.status(201).json({ message: 'Blog created successfully', blogId: result.insertId });
  });
});

// Retrieve all public blogs
router.get('/blogs', (req, res) => {
  const sql = `
    SELECT b.id, b.title, b.content, b.created_at, u.name AS authorName 
    FROM blogs b 
    JOIN users u ON b.userId = u.id 
    WHERE b.visibility = 'public'
    ORDER BY b.created_at DESC`;
  db.query(sql, (err, blogs) => {
    if (err) {
      console.error('Error fetching blogs:', err);
      return res.status(500).json({ error: 'Error fetching blogs.' });
    }
    res.json(blogs);
  });
});

// Retrieve a single blog by id
router.get('/blogs/:id', (req, res) => {
  const blogId = req.params.id;
  const sql = `
    SELECT b.id, b.title, b.content, b.created_at, u.name AS authorName 
    FROM blogs b 
    JOIN users u ON b.userId = u.id 
    WHERE b.id = ?`;
  db.query(sql, [blogId], (err, results) => {
    if (err) {
      console.error('Error fetching blog:', err);
      return res.status(500).json({ error: 'Error fetching blog.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Blog not found.' });
    }
    res.json(results[0]);
  });
});

// Update a blog by id (only if the logged-in user is the author)
router.put('/blogs/:id', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: 'Unauthorized access. No valid session.' });
  }
  const userId = sessions[sessionId];
  const blogId = req.params.id;
  const { title, content, visibility } = req.body;
  const checkSql = 'SELECT * FROM blogs WHERE id = ? AND userId = ?';
  db.query(checkSql, [blogId, userId], (err, results) => {
    if (err) {
      console.error('Error fetching blog for update:', err);
      return res.status(500).json({ error: 'Error occurred while updating the blog.' });
    }
    if (results.length === 0) {
      return res.status(403).json({ error: 'You are not authorized to edit this blog.' });
    }
    const updateSql = 'UPDATE blogs SET title = ?, content = ?, visibility = ? WHERE id = ?';
    db.query(updateSql, [title, content, visibility, blogId], (err) => {
      if (err) {
        console.error('Error updating blog:', err);
        return res.status(500).json({ error: 'Error occurred while updating the blog.' });
      }
      res.json({ message: 'Blog updated successfully.' });
    });
  });
});

// Delete a blog by id (only if the logged-in user is the author)
router.delete('/blogs/:id', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: 'Unauthorized access. No valid session.' });
  }
  const userId = sessions[sessionId];
  const blogId = req.params.id;
  const checkSql = 'SELECT * FROM blogs WHERE id = ? AND userId = ?';
  db.query(checkSql, [blogId, userId], (err, results) => {
    if (err) {
      console.error('Error fetching blog for deletion:', err);
      return res.status(500).json({ error: 'Error occurred while deleting the blog.' });
    }
    if (results.length === 0) {
      return res.status(403).json({ error: 'You are not authorized to delete this blog.' });
    }
    const deleteSql = 'DELETE FROM blogs WHERE id = ?';
    db.query(deleteSql, [blogId], (err) => {
      if (err) {
        console.error('Error deleting blog:', err);
        return res.status(500).json({ error: 'Error occurred while deleting the blog.' });
      }
      res.json({ message: 'Blog deleted successfully.' });
    });
  });
});

// Retrieve blogs for the authenticated user
router.get('/users/:userId/blogs', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: 'Unauthorized access. No valid session.' });
  }
  // Use the user ID from our session store (ignoring the userId parameter)
  const userId = sessions[sessionId];
  const sql = 'SELECT id, title, content, created_at FROM blogs WHERE userId = ? ORDER BY created_at DESC';
  db.query(sql, [userId], (err, blogs) => {
    if (err) {
      console.error('Error fetching user blogs:', err);
      return res.status(500).json({ error: 'Error fetching blogs.' });
    }
    res.json(blogs);
  });
});

// ----------------------
// COMMENT ENDPOINTS
// ----------------------

// Save a comment for a blog
router.post('/blogs/:id/comments', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: 'Unauthorized access. No valid session.' });
  }
  const userId = sessions[sessionId];
  const blogId = req.params.id;
  const { content } = req.body;
  const sql = `INSERT INTO comments (userId, blogId, content) VALUES (?, ?, ?)`;
  db.query(sql, [userId, blogId, content], (err, result) => {
    if (err) {
      console.error('Error saving comment:', err);
      return res.status(500).json({ error: 'Error saving comment.' });
    }
    res.status(201).json({ message: 'Comment saved successfully', commentId: result.insertId });
  });
});

// Retrieve all comments for a specific blog
router.get('/blogs/:id/comments', (req, res) => {
  const blogId = req.params.id;
  const sql = `
    SELECT c.id, c.content, c.created_at, u.name AS commenter 
    FROM comments c 
    JOIN users u ON c.userId = u.id  
    WHERE c.blogId = ? 
    ORDER BY c.created_at ASC`;
  db.query(sql, [blogId], (err, comments) => {
    if (err) {
      console.error('Error fetching comments:', err);
      return res.status(500).json({ error: 'Error fetching comments.' });
    }
    res.json(comments);
  });
});

module.exports = router;
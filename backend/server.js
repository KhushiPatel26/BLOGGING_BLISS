require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');

const app = express();

// Security middleware
app.use(helmet());

// Configure CORS to allow requests from your frontend and include credentials
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://blogging-bliss.vercel.app',
  credentials: true,
}));

// Use built-in middleware for JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration (consider a persistent store like Redis for production)
app.use(session({
  secret: process.env.SESSION_SECRET || 'Blogging_Bliss',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // secure cookies in production (HTTPS)
}));

// Serve static files if you want to host your frontend from the backend
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api', authRoutes);
app.use('/api', blogRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const db = require('./db');

const app = express();
const path = require('path');

// Session configuration
app.use(session({
    secret: 'Blogging_Bliss', // Change this to a strong secret
    resave: false,
    saveUninitialized: false, // Do not save uninitialized sessions
    cookie: { secure: false } // Set to true if using HTTPS
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api', authRoutes);
app.use('/api', blogRoutes);

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');

const app = express();

// Configure CORS to allow requests from your Vercel frontend and include credentials
app.use(cors({
    origin: 'https://blogging-bliss.vercel.app',
    credentials: true,
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration (for production, consider a persistent store like Redis)
app.use(session({
    secret: 'Blogging_Bliss', // Change this to a strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if serving over HTTPS
}));

// (Optional) Serve static files if you want to host your frontend from the backend as well
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api', authRoutes);
app.use('/api', blogRoutes);

// Use the PORT environment variable provided by Render, or fallback to 3000 for local development
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
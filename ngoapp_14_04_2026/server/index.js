require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import the modular API routes
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
// Limit increased to 50mb to comfortably handle Base64 PDF and Image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount API Routes
app.use('/api', apiRoutes);

// ==========================================
// RENDER DEPLOYMENT SETUP
// ==========================================
// ✅ FIXED: Removed the cPanel code that was searching for the React 'dist' folder.
// Render is now strictly acting as your Backend API, and Vercel handles the Frontend.

app.get('/', (req, res) => {
    res.send('✅ NGO Backend API is running perfectly on Render!');
});

// Render automatically assigns a port (usually 10000)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
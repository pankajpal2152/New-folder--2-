require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import the modular API routes
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ CRITICAL FIX: Serve the documents folder statically. 
// This allows the frontend to load images via URL.
app.use('/allDocumentsFolder', express.static(path.join(__dirname, 'allDocumentsFolder')));

// Mount API Routes
app.use('/api', apiRoutes);

// ==========================================
// RENDER DEPLOYMENT SETUP
// ==========================================
app.get('/', (req, res) => {
    res.send('✅ NGO Backend API is running perfectly on Render!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
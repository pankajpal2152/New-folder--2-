require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import the modular API routes
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
// Limit increased to 50mb to comfortably handle Base64 PDF and Image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ FIX: Define exact same path using process.cwd() so it perfectly matches fileUploadHelper
const docsFolder = path.join(process.cwd(), 'allDocumentsFolder');

// Ensure the folder exists on server startup to prevent crashes
if (!fs.existsSync(docsFolder)) {
    fs.mkdirSync(docsFolder, { recursive: true });
}

// Serve the documents folder statically so frontend can access images/PDFs
app.use('/allDocumentsFolder', express.static(docsFolder));

// Mount API Routes
app.use('/api', apiRoutes);

// ==========================================
// RENDER DEPLOYMENT SETUP
// ==========================================
app.get('/', (req, res) => {
    res.send('✅ NGO Backend API is running perfectly on Render!');
});

// Render automatically assigns a port (usually 10000)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📂 Serving documents from: ${docsFolder}`);
});
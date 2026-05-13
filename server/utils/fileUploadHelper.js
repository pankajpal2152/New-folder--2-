const fs = require('fs');
const path = require('path');

/**
 * Saves Base64 data to a physical file and returns the filename
 * @param {string} base64Data - The raw base64 string from frontend
 * @param {string} category - e.g., 'AsthaDidi', 'Supervisor', 'DistNGO'
 * @param {number|string} id - The unique ID of the record
 * @param {string} docType - e.g., 'Profile', 'PanCard', 'Darpan'
 * @returns {string|null} - The generated filename to store in DB
 */
const saveBase64File = (base64Data, category, id, docType) => {
    if (!base64Data || base64Data.includes('ID:')) return base64Data; // Skip if already processed or empty

    try {
        // ✅ FIX: Use process.cwd() to perfectly match the server.js static path
        // This ensures the folder is created at the absolute root of your project
        const dir = path.join(process.cwd(), 'allDocumentsFolder');
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Safely extract the exact extension to prevent substring errors
        let extension = "png"; // fallback
        if (base64Data.includes("image/jpeg")) extension = "jpeg";
        else if (base64Data.includes("image/jpg")) extension = "jpg";
        else if (base64Data.includes("image/png")) extension = "png";
        else if (base64Data.includes("application/pdf")) extension = "pdf";

        const fileName = `${category}_ID${id}_${docType}.${extension}`;
        const filePath = path.join(dir, fileName);

        // Remove the base64 header (e.g., data:image/jpeg;base64,) and write to file
        const base64Image = base64Data.split(';base64,').pop();
        fs.writeFileSync(filePath, base64Image, { encoding: 'base64' });

        return fileName; // Return the exact name so frontend can fetch it
    } catch (error) {
        console.error("File Save Error:", error);
        return null;
    }
};

module.exports = { saveBase64File };
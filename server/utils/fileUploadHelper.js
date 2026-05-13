// src/utils/fileUploadHelper.js
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
        // Ensure the directory exists
        const dir = path.join(__dirname, '../../allDocumentsFolder');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Identify file extension (e.g., image/png -> .png)
        const extension = base64Data.substring(base64Data.indexOf("/") + 1, base64Data.indexOf(";base64"));
        const fileName = `${category}_ID${id}_${docType}.${extension}`;
        const filePath = path.join(dir, fileName);

        // Remove header (data:image/png;base64,) and save
        const base64Image = base64Data.split(';base64,').pop();
        fs.writeFileSync(filePath, base64Image, { encoding: 'base64' });

        return fileName; // This is what we save in the DB column
    } catch (error) {
        console.error("File Save Error:", error);
        return null;
    }
};

module.exports = { saveBase64File };
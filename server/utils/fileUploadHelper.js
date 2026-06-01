const fs = require('fs');
const path = require('path');

const saveBase64File = (base64Data, category, id, docType) => {
    if (!base64Data || base64Data.includes('ID:')) return base64Data;

    try {
        // ✅ GUARANTEED MATCH: Uses the exact same path formula as server.js
        const dir = path.join(process.cwd(), 'allDocumentsFolder');

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        let extension = "png";
        if (base64Data.includes("image/jpeg")) extension = "jpeg";
        else if (base64Data.includes("image/jpg")) extension = "jpg";
        else if (base64Data.includes("image/png")) extension = "png";
        else if (base64Data.includes("application/pdf")) extension = "pdf";

        const fileName = `${category}_ID${id}_${docType}.${extension}`;
        const filePath = path.join(dir, fileName);

        const base64Image = base64Data.split(';base64,').pop();
        fs.writeFileSync(filePath, base64Image, { encoding: 'base64' });

        return fileName;
    } catch (error) {
        console.error("File Save Error:", error);
        return null;
    }
};

module.exports = { saveBase64File };
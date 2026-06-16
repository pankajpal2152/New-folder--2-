const fs = require("fs");
const path = require("path");

const saveBase64File = (base64Data, category, id, docType) => {
  if (!base64Data) return base64Data;
  if (typeof base64Data !== "string") return null;

  const dataUrlMatch = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  if (!dataUrlMatch) {
    return base64Data;
  }

  try {
    // ✅ GUARANTEED MATCH: Uses the exact same path formula as server.js
    const dir = path.join(process.cwd(), "allDocumentsFolder");

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const mimeType = dataUrlMatch[1];
    let extension = "png";
    if (mimeType === "image/jpeg") extension = "jpeg";
    else if (mimeType === "image/jpg") extension = "jpg";
    else if (mimeType === "image/png") extension = "png";
    else if (mimeType === "application/pdf") extension = "pdf";

    const fileName = `${category}_ID${id}_${docType}.${extension}`;
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, dataUrlMatch[2], { encoding: "base64" });

    return fileName;
  } catch (error) {
    console.error("File Save Error:", error);
    return null;
  }
};

module.exports = { saveBase64File };

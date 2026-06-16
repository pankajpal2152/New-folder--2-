require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Import the modular API routes
const apiRoutes = require("./routes/apiRoutes");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ Define precise absolute path for documents
const docsFolder = path.join(process.cwd(), "allDocumentsFolder");

// ✅ Create the folder immediately if it doesn't exist
if (!fs.existsSync(docsFolder)) {
  fs.mkdirSync(docsFolder, { recursive: true });
  console.log("✅ Created allDocumentsFolder automatically.");
}

// Serve documents statically
app.use("/allDocumentsFolder", express.static(docsFolder));

app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.send("✅ NGO Backend API is running perfectly on Render!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📂 Serving documents from: ${docsFolder}`);
});

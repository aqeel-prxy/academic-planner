const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "../../uploads/exam-pdfs");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeBaseName = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 60);
    const timestamp = Date.now();
    cb(null, `${timestamp}-${safeBaseName || "lecture"}.pdf`);
  },
});

const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === "application/pdf";
  const isPdfExt = path.extname(file.originalname || "").toLowerCase() === ".pdf";

  if (isPdfMime || isPdfExt) {
    cb(null, true);
    return;
  }

  cb(new Error("Only PDF files are allowed"));
};

const uploadExamPdfs = multer({
  storage,
  fileFilter,
  limits: {
    files: 10,
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = {
  uploadExamPdfs,
};

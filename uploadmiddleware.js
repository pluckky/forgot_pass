import multer from "multer";
import path from "path";

// Configure storage for Multer
const storage = multer.memoryStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // e.g., 1689098761234-123456789.jpg
  },
});

// Create the upload middleware
export const upload = multer({ storage });

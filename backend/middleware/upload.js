const multer = require('multer');
const path = require('path');

// Configure multer storage for images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Check if the app is in sandbox mode
    const uploadFolder = req.user && req.user.sandbox ? 'assetsSandbox' : 'assets';
    cb(null, uploadFolder); // Destination folder based on sandbox mode
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique file name
  },
});

const upload = multer({ storage });

module.exports = {
  upload,
};



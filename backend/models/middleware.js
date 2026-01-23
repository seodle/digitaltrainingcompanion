const Schemas = require("./embeddingModel");
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Get user token
const getUser = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send('Access denied. No token provided.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
        req.user = decoded; // Set the entire decoded token as req.user
        next();
    } catch (ex) {
        res.status(400).send('Invalid token.');
    }
};

// Select the right collection depending on the sandbox parameters (true or false)
const setCollection = (req, res, next) => {

    // Ensure req.user exists
    if (!req.user) {
        // Handle the error appropriately
        return res.status(401).send("User not authenticated");
    }

    // Dynamically set models based on sandbox mode
    req.models = Object.keys(Schemas).reduce((models, modelName) => {
        models[modelName] = req.user.sandbox
            ? Schemas[`${modelName}Sandbox`]
            : Schemas[modelName];
        return models;
    }, {});

    // Optional: Add logging for debugging
    console.log(`Routing to ${req.user.sandbox ? 'sandbox' : 'regular'} models`);

    next();
};

// Configure multer storage for images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Check if the app is in sandbox mode
        const uploadFolder = req.user && req.user.sandbox ? 'assetsSandbox' : 'assets';
        cb(null, uploadFolder); // Destination folder based on sandbox mode
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique file name
    }
});

const upload = multer({ storage: storage });

module.exports = {
    getUser,
    setCollection,
    upload
};
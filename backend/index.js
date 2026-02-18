const express = require("express");
const mongoose = require("mongoose");
const path = require('path');
require('dotenv').config();

const bodyParser = require("body-parser");
const cors = require('cors');

// Middleware
const { getUser, requireAdmin } = require('./middleware/authorization.js');

// Routes
const registerRoutes = require("./routes/register");
const authRoutes = require("./routes/auth");
const surveyRoutes = require("./routes/survey");
const monitoringRoutes = require("./routes/monitoring");
const assessmentRoutes = require("./routes/assessment");
const responseRoutes = require("./routes/response");
const userRoutes = require("./routes/user");
const logRoutes = require("./routes/log");
const documentEmbedding = require("./routes/documentEmbedding");
const semanticSimiliaritySearch = require("./routes/semanticSimilaritySearch.js");
const exportsRoutes = require("./routes/exports");
const apiKeysRoutes = require("./routes/apiKeys");
const aiToolsRoutes = require("./routes/aiTools");
const questionWidgetRoutes = require('./routes/questionWidget');
const adminRoutes = require('./routes/admin');

const app = express();

// Trust proxy headers
app.set('trust proxy', true);

// Log incoming requests (for debugging purposes)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Method: ${req.method}; Host: ${req.headers.host}; Path: ${req.path}`);
  next();
});

// CORS setup
const allowedOrigins = [
  'https://digitaltrainingcompanion.ch',
  'https://www.digitaltrainingcompanion.ch',
  'https://api.digitaltrainingcompanion.ch',
  'https://dev.digitaltrainingcompanion.ch',
  'https://www.dev.digitaltrainingcompanion.ch',
  'https://dev.api.digitaltrainingcompanion.ch',
  'https://digitaltrainingcompanion.tech',
  'https://www.digitaltrainingcompanion.tech',
  'http://localhost:3000',
  'http://localhost:4000'
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log(`Checking origin: ${origin}`);
    // Allow requests with no origin (like curl, Postman, or mobile apps)
    if (!origin) {
      console.log('No origin header present');
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      console.log('Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));

//Storing images folder
app.use('/assets', express.static('assets'));
// Storing images for the sandbox environment
app.use('/assetsSandbox', express.static('assetsSandbox'));

// #########################################################
// IMPORTANT
// - When adding a new router, define first if it needs JWT authentication or not (most routers do!)
// - On top, add admin rights privileges if needed.
// - Then, add the route to one of the three groups: PUBLIC, AUTHENTICATED, ADMIN. 
// - ORDER MATTERS, so do not put an authenticated route before a non-authenticated route.
// - If a route needs authentication or admin rights, do not use app.use("/", ...), specify the route name instead (e.g. app.use("/users", ...);)

// PUBLIC ROUTES (NO JWT REQUIRED)
app.use("/", questionWidgetRoutes);
app.use("/", registerRoutes);
app.use("/", authRoutes);
app.use("/", surveyRoutes);

// AUTHENTICATED ROUTES (JWT REQUIRED)
app.use("/users", getUser, userRoutes);
app.use("/monitorings", getUser, monitoringRoutes);
app.use("/assessments", getUser, assessmentRoutes);
app.use("/responses", getUser, responseRoutes);
app.use("/logs", getUser, logRoutes);
app.use("/export", getUser, exportsRoutes);
app.use("/api-keys", getUser, apiKeysRoutes);
app.use("/ai-tools", getUser, aiToolsRoutes);
app.use("/semantic", getUser, semanticSimiliaritySearch);

// ADMIN-ONLY ROUTES (JWT + ADMIN RIGHTS REQUIRED)
app.use("/document", getUser, requireAdmin, documentEmbedding);
app.use("/admin", getUser, requireAdmin, adminRoutes);

// #########################################################

// Serve static files for frontend
app.use(express.static('/var/www/digitaltrainingcompanion'));

// Catch-all route to direct requests to frontend
app.get('*', (req, res) => {
  res.sendFile(path.resolve('/var/www/digitaltrainingcompanion', 'index.html'));
});

const isDevelopment = process.env.NODE_ENV === "development";
const dbURI = isDevelopment ? process.env.DB_URI_DEVELOPMENT : process.env.DB_URI_PRODUCTION;

mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`DB connected! (Using ${isDevelopment ? "local" : "cloud"} database on ${dbURI})`);
  })
  .catch((err) => {
    console.error(`Failed to connect to the database at ${dbURI}`, err);
  });


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`❌ [${timestamp}] Error occurred during ${req.method} ${req.originalUrl}`);
  console.error(`Message: ${err.message}`);
  console.error(`Stack: ${err.stack}\n`);
  res.status(err.status || 500).json({ error: 'Internal server error' });
});
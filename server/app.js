const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const authRoutes = require('./routes/auth');
const filesRoutes = require('./routes/files');
const foldersRoutes = require('./routes/folders');
const adminRoutes = require('./routes/admin');

const app = express();

// Simple logger
const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || 'info',
	transports: [new winston.transports.Console({ format: winston.format.simple() })]
});

// Basic security hardening
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting with proper keyGenerator for trust proxy
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  keyGenerator: (req) => {
    // Use X-Forwarded-For if available (proxy), otherwise use IP
    return req.ip || req.connection.remoteAddress;
  }
});
app.use(limiter);

// Enforce HTTPS in production behind proxy
app.enable('trust proxy');
app.use((req, res, next) => {
	if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
		return res.redirect(`https://${req.headers.host}${req.url}`);
	}
	next();
});

app.use('/api/auth', authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/folders', foldersRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(path.join(__dirname, '../client')));

module.exports = app;

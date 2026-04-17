/**
 * server.js — Express application entry point.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

// Route imports
const authRoutes = require('./routes/auth.routes');
const tenantRoutes = require('./routes/tenant.routes');
const departmentRoutes = require('./routes/department.routes');
const classRoutes = require('./routes/class.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const disputeRoutes = require('./routes/dispute.routes');
const statsRoutes = require('./routes/stats.routes');
const adminRoutes = require('./routes/admin.routes');
const auditRoutes = require('./routes/audit.routes');

const rateLimit = require('express-rate-limit');

const app = express();

app.set('trust proxy', 1);

// --------------------------------------------------
// Global Middleware & Security Limits
// --------------------------------------------------
app.use(helmet());

// Restrict CORS array to your deployed frontend URLs
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000', 'https://ronak-javiya.github.io', '*', 'https://ronak-pc.tailf0fdeb.ts.net/'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per window
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth Limiter (Brute-force protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // Max 10 login/register attempts per IP
    message: 'Too many auth attempts from this IP, try again later.'
});

// --------------------------------------------------
// Health Check
// --------------------------------------------------
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'smart-attendance-backend' });
});

// --------------------------------------------------
// Serverless DB Connection Middleware
// --------------------------------------------------
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(500).json({ error: 'Database connection error in Serverless Environment' });
    }
});

// --------------------------------------------------
// API Routes
// --------------------------------------------------
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audit-logs', auditRoutes);

// --------------------------------------------------
// Error Handler (must be last)
// --------------------------------------------------
app.use(errorHandler);

// --------------------------------------------------
// Start Server (For Local / Non-Vercel Deployments)
// --------------------------------------------------
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(config.port, () => {
        console.log(`[Server] Running locally on port ${config.port}`);
    });
}

// Export for Vercel
module.exports = app;

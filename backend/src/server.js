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
const enrollmentRoutes = require('./routes/enrollment.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const disputeRoutes = require('./routes/dispute.routes');

const app = express();

// --------------------------------------------------
// Global Middleware
// --------------------------------------------------
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------------------------------------
// Health Check
// --------------------------------------------------
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'smart-attendance-backend' });
});

// --------------------------------------------------
// API Routes
// --------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/disputes', disputeRoutes);

// --------------------------------------------------
// Error Handler (must be last)
// --------------------------------------------------
app.use(errorHandler);

// --------------------------------------------------
// Start Server
// --------------------------------------------------
async function start() {
    await connectDB();
    app.listen(config.port, () => {
        console.log(`[Server] Running on port ${config.port} (${config.env})`);
    });
}

start().catch(err => {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
});

module.exports = app;

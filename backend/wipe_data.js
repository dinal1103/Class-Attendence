const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Load Models
const AttendanceSession = require('./src/models/AttendanceSession');
const AttendanceRecord = require('./src/models/AttendanceRecord');
const AuditLog = require('./src/models/AuditLog');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-attendance';

async function wipeData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        // 1. Wipe Database Collections
        console.log('Wiping AttendanceRecords...');
        await AttendanceRecord.deleteMany({});
        
        console.log('Wiping AttendanceSessions...');
        await AttendanceSession.deleteMany({});
        
        console.log('Wiping AuditLogs (Archived Records)...');
        await AuditLog.deleteMany({});

        console.log('Database wipe complete.');

        // 2. Wipe Physical Images
        const tempDir = path.join(__dirname, 'temp');
        if (fs.existsSync(tempDir)) {
            console.log(`Wiping image storage at ${tempDir}...`);
            const files = fs.readdirSync(tempDir);
            for (const file of files) {
                const fullPath = path.join(tempDir, file);
                if (fs.lstatSync(fullPath).isDirectory()) {
                    fs.rmSync(fullPath, { recursive: true, force: true });
                } else if (file !== '.gitkeep') {
                    fs.unlinkSync(fullPath);
                }
            }
            console.log('Image storage wipe complete.');
        }

        console.log('SUCCESS: All session data and archival logs have been removed.');
        process.exit(0);
    } catch (err) {
        console.error('FATAL ERROR during wipe:', err);
        process.exit(1);
    }
}

wipeData();

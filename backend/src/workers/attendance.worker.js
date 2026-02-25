/**
 * attendance.worker.js — BullMQ worker for processing attendance sessions.
 *
 * Flow:
 *   1. Read temp image paths from job payload
 *   2. Call AI service for classroom face detections
 *   3. Decrypt enrolled student embeddings for the class
 *   4. Greedy one-to-one matching using cosine similarity
 *   5. Apply two-threshold decision model:
 *        ≥ HIGH  → present
 *        LOW–HIGH → flagged (present with mark)
 *        < LOW   → ignored
 *   6. Auto-reject session if detection ratio < 25%
 *   7. Save AttendanceRecords and update session status
 *   8. Delete temp images
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const config = require('../config');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Class = require('../models/Class');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const aiClient = require('../services/aiClient');
const storage = require('../services/storage');
const { decrypt } = require('../utils/crypto');

// --------------------------------------------------
// Matching Helpers
// --------------------------------------------------

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-12);
}

/**
 * Greedy one-to-one matching.
 * Returns array of { studentId, score } for each detection matched.
 * Unmatched detections are ignored.
 */
function greedyMatch(detections, enrolledStudents, highThreshold, lowThreshold) {
    // Build all pairs: (detectionIdx, studentIdx, score)
    const pairs = [];
    for (let d = 0; d < detections.length; d++) {
        for (let s = 0; s < enrolledStudents.length; s++) {
            const score = cosineSimilarity(detections[d].embedding, enrolledStudents[s].embedding);
            if (score >= lowThreshold) {
                pairs.push({ d, s, score });
            }
        }
    }

    // Sort descending by score (greedy)
    pairs.sort((a, b) => b.score - a.score);

    const usedDetections = new Set();
    const usedStudents = new Set();
    const matches = [];

    for (const pair of pairs) {
        if (usedDetections.has(pair.d) || usedStudents.has(pair.s)) continue;
        usedDetections.add(pair.d);
        usedStudents.add(pair.s);

        matches.push({
            studentId: enrolledStudents[pair.s].id,
            score: pair.score,
            status: pair.score >= highThreshold ? 'present' : 'flagged'
        });
    }

    return matches;
}

// --------------------------------------------------
// Job Processor
// --------------------------------------------------

async function processAttendance(job) {
    const { sessionId, tenantId, classId } = job.data;
    console.log(`[Worker] Processing session ${sessionId}`);

    const session = await AttendanceSession.findById(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    try {
        // Mark as processing
        session.status = 'processing';
        await session.save();

        // 1. Get tenant thresholds
        const tenant = await Tenant.findById(tenantId);
        const highThreshold = tenant?.settings?.highThreshold ?? config.attendance.highThreshold;
        const lowThreshold = tenant?.settings?.lowThreshold ?? config.attendance.lowThreshold;
        const minDetectionRatio = tenant?.settings?.minDetectionRatio ?? 0.25;

        // 2. Get class and enrolled students
        const cls = await Class.findById(classId);
        if (!cls) throw new Error(`Class ${classId} not found`);

        const enrolledUsers = await User.find({
            _id: { $in: cls.students },
            tenant_id: tenantId,
            isEnrolled: true,
            embedding: { $ne: null }
        });

        // Decrypt embeddings
        const enrolledStudents = enrolledUsers.map(u => ({
            id: u._id,
            embedding: decrypt(u.embedding)
        }));

        // 3. Call AI microservice
        const imagePaths = storage.listFiles(session._id.toString());
        const detections = await aiClient.getClassroomDetections(imagePaths);

        session.totalDetections = detections.length;
        session.totalStudents = cls.students.length;

        // 4. Check detection ratio
        const detectionRatio = cls.students.length > 0
            ? detections.length / cls.students.length
            : 0;
        session.detectionRatio = detectionRatio;

        if (detectionRatio < minDetectionRatio && detections.length > 0) {
            session.status = 'rejected';
            session.rejectionReason = `Detection ratio ${(detectionRatio * 100).toFixed(1)}% is below minimum ${(minDetectionRatio * 100)}%. Photo quality may be poor.`;
            session.processedAt = new Date();
            await session.save();
            console.log(`[Worker] Session ${sessionId} REJECTED: low detection ratio`);
            return;
        }

        // 5. Greedy matching
        const matches = greedyMatch(detections, enrolledStudents, highThreshold, lowThreshold);
        const matchedStudentIds = new Set(matches.map(m => m.studentId.toString()));

        // 6. Build attendance records
        const records = [];

        // Matched students (present or flagged)
        for (const match of matches) {
            records.push({
                tenant_id: tenantId,
                session_id: sessionId,
                student_id: match.studentId,
                status: match.status,
                confidenceScore: match.score
            });
        }

        // Unmatched enrolled students → absent
        for (const studentId of cls.students) {
            if (!matchedStudentIds.has(studentId.toString())) {
                records.push({
                    tenant_id: tenantId,
                    session_id: sessionId,
                    student_id: studentId,
                    status: 'absent',
                    confidenceScore: 0
                });
            }
        }

        // 7. Save records
        if (records.length > 0) {
            await AttendanceRecord.insertMany(records);
        }

        // 8. Mark session completed
        session.status = 'completed';
        session.processedAt = new Date();
        await session.save();

        console.log(`[Worker] Session ${sessionId} COMPLETED: ${matches.length} present/flagged, ${cls.students.length - matches.length} absent`);

    } catch (err) {
        session.status = 'failed';
        session.rejectionReason = err.message;
        session.processedAt = new Date();
        await session.save();
        console.error(`[Worker] Session ${sessionId} FAILED:`, err.message);
        throw err;
    } finally {
        // Always clean up temp images
        storage.deleteSessionFiles(session._id.toString());
    }
}

// --------------------------------------------------
// Start Worker
// --------------------------------------------------

async function startWorker() {
    await mongoose.connect(config.db.uri);
    console.log('[Worker] MongoDB connected');

    const worker = new Worker('attendance', processAttendance, {
        connection: { host: config.redis.host, port: config.redis.port },
        concurrency: 3
    });

    worker.on('completed', (job) => {
        console.log(`[Worker] Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job.id} failed:`, err.message);
    });

    console.log('[Worker] Attendance worker started. Waiting for jobs...');
}

startWorker().catch(err => {
    console.error('[Worker] Fatal error:', err);
    process.exit(1);
});

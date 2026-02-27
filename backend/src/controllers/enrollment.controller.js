/**
 * enrollment.controller.js — Student face enrollment.
 * Accepts 5+ images, calls AI service, encrypts & stores embedding.
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const aiClient = require('../services/aiClient');
const storage = require('../services/storage');
const { encrypt } = require('../utils/crypto');

// Multer config — save to temp
// Multer config — save directly to OS temp
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const tempDir = storage.getBaseDir();
            cb(null, tempDir);
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only .jpg, .jpeg, .png images allowed'), false);
        }
    }
}).array('images', 15); // max 15 images

/**
 * POST /api/enrollment/:studentId
 * Multipart: images[] (5+ face photos)
 */
exports.uploadMiddleware = upload;

exports.enroll = async (req, res, next) => {
    try {
        const { studentId } = req.params;

        // Verify student exists and belongs to this tenant
        const student = await User.findOne({
            _id: studentId,
            tenant_id: req.tenantId,
            role: 'student'
        });
        if (!student) {
            return res.status(404).json({ error: 'Student not found.' });
        }

        if (!req.files || req.files.length < 5) {
            return res.status(400).json({ error: 'At least 5 face images are required.' });
        }

        const imagePaths = req.files.map(file => file.path);

        try {
            // Call AI microservice
            const result = await aiClient.getStudentEmbedding(studentId, imagePaths);

            // Encrypt embedding and save
            const encryptedEmbedding = encrypt(result.embedding);
            student.embedding = encryptedEmbedding;
            student.isEnrolled = true;
            await student.save();

            res.json({
                message: 'Enrollment successful.',
                studentId,
                imagesUsed: result.imagesUsed
            });
        } finally {
            // Clean up temporary disk files
            for (const p of imagePaths) {
                if (fs.existsSync(p)) fs.unlinkSync(p);
            }
        }
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/enrollment/self
 * Student self-enrollment: uses req.user.user_id
 */
exports.selfEnroll = async (req, res, next) => {
    try {
        const studentId = req.user.user_id;

        const student = await User.findOne({
            _id: studentId,
            tenant_id: req.tenantId,
            role: 'student'
        });
        if (!student) {
            return res.status(404).json({ error: 'Student not found.' });
        }

        if (!req.files || req.files.length < 5) {
            return res.status(400).json({ error: 'At least 5 face images are required.' });
        }

        const imagePaths = req.files.map(file => file.path);

        try {
            const result = await aiClient.getStudentEmbedding(studentId, imagePaths);

            const encryptedEmbedding = encrypt(result.embedding);
            student.embedding = encryptedEmbedding;
            student.isEnrolled = true;
            await student.save();

            res.json({
                message: 'Face enrollment successful.',
                studentId,
                imagesUsed: result.imagesUsed
            });
        } finally {
            for (const p of imagePaths) {
                if (fs.existsSync(p)) fs.unlinkSync(p);
            }
        }
    } catch (err) {
        next(err);
    }
};

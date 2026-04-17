/**
 * aiClient.js — HTTP client to communicate with the AI Face Microservice.
 */
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const AI_BASE = config.ai.url;

/**
 * Generate a mean face embedding for a student from multiple images.
 * @param {string} studentId
 * @param {string[]} imagePaths – absolute paths to image files on disk
 * @returns {{ studentId, embedding: number[], imagesUsed: number }}
 */
async function getStudentEmbedding(studentId, imagePaths) {
    const form = new FormData();
    form.append('studentId', studentId);

    for (const imgPath of imagePaths) {
        form.append('images', fs.createReadStream(imgPath), path.basename(imgPath));
    }

    const res = await axios.post(`${AI_BASE}/embedding/student`, form, {
        headers: {
            ...form.getHeaders(),
            'X-API-Key': config.ai.apiKey
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 120_000 // 2 min for heavy AI inference
    });

    return res.data;
}

/**
 * Detect all faces in classroom photos.
 * @param {string[]} imagePaths – absolute paths to classroom image files
 * @returns {Array<{ embedding: number[], bbox: number[] }>}
 */
async function getClassroomDetections(imagePaths) {
    const form = new FormData();

    for (const imgPath of imagePaths) {
        form.append('images', fs.createReadStream(imgPath), path.basename(imgPath));
    }

    const res = await axios.post(`${AI_BASE}/embedding/classroom`, form, {
        headers: {
            ...form.getHeaders(),
            'X-API-Key': config.ai.apiKey
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 120_000
    });

    return res.data;
}

/**
 * Health check on AI service.
 */
async function healthCheck() {
    const res = await axios.get(`${AI_BASE}/health`, { timeout: 5000 });
    return res.data;
}

/**
 * Draw bounding boxes over the classroom image using OpenCV.
 */
async function visualizeAttendance(imagePath, targets) {
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath), path.basename(imagePath));
    form.append('targets_json', JSON.stringify(targets));

    const res = await axios.post(`${AI_BASE}/visualize`, form, {
        headers: {
            ...form.getHeaders(),
            'X-API-Key': config.ai.apiKey
        },
        responseType: 'arraybuffer', // Important to save binary image data
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 120_000
    });

    return res.data; // returns Buffer
}

module.exports = { getStudentEmbedding, getClassroomDetections, healthCheck, visualizeAttendance };

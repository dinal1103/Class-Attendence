/**
 * crypto.js — AES-256-CBC encryption/decryption for face embeddings.
 * Embeddings are stored as encrypted strings in MongoDB.
 */
const crypto = require('crypto');
const config = require('../config');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Encrypt a JSON-serializable value (e.g., a 512-d float array).
 * Returns a hex string: iv:encrypted
 */
function encrypt(data) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(config.security.encryptionKey, 'utf-8');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const jsonStr = JSON.stringify(data);
    let encrypted = cipher.update(jsonStr, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an iv:encrypted hex string back to the original value.
 */
function decrypt(encryptedStr) {
    const [ivHex, encrypted] = encryptedStr.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = Buffer.from(config.security.encryptionKey, 'utf-8');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
}

module.exports = { encrypt, decrypt };

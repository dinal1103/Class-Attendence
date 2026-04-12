require('dotenv').config();

module.exports = {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',

    db: {
        uri: process.env.MONGODB_URI || 'mongodb://mongodb:27020/smart-attendance'
    },

    redis: {
        host: process.env.REDIS_HOST || 'redis',
        port: process.env.REDIS_PORT || 6379
    },

    ai: {
        url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
        apiKey: process.env.AI_SERVICE_API_KEY || 'dev_api_key_123'
    },

    security: {
        jwtSecret: process.env.JWT_SECRET || 'secret',
        encryptionKey: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef' // 32 chars
    },

    attendance: {
        highThreshold: parseFloat(process.env.HIGH_THRESHOLD) || 0.85,
        lowThreshold: parseFloat(process.env.LOW_THRESHOLD) || 0.75
    }
};

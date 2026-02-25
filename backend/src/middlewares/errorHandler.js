/**
 * errorHandler.js — Global Express error handler.
 */
function errorHandler(err, req, res, _next) {
    console.error('Unhandled error:', err);

    const status = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

module.exports = errorHandler;

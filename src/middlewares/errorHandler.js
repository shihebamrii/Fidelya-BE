import logger from '../config/logger.js';

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found error handler - for 404 routes
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
};

/**
 * Centralized error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'unknown';
    message = `${field} already exists`;
    details = { field, value: err.keyValue ? err.keyValue[field] : 'unknown' };
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error
  if (statusCode >= 500) {
    // Sanitize body to avoid logging passwords or tokens
    const sanitizedBody = req.body ? { ...req.body } : {};
    const sensitiveFields = ['password', 'passwordHash', 'token', 'refreshToken', 'oldPassword', 'newPassword'];
    
    sensitiveFields.forEach(field => {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = '***MASKED***';
      }
    });

    logger.error(`${statusCode} - ${message}`, {
      error: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: sanitizedBody,
      user: req.user?.id
    });
  } else {
    logger.warn(`${statusCode} - ${message}`, {
      url: req.originalUrl,
      method: req.method
    });
  }

  // Send response
  const response = {
    status: 'error',
    message
  };

  if (details) {
    response.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export { ApiError, notFoundHandler, errorHandler };

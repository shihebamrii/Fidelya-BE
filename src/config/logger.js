import winston from 'winston';
import morgan from 'morgan';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create Winston logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  defaultMeta: { service: 'loyalty-api' },
  transports: [
    // Console transport - Always enable
    new winston.transports.Console({
      format: combine(
        colorize(),
        consoleFormat
      )
    })
  ]
});

// Add file transports only if NOT on Vercel
if (!process.env.VERCEL) {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: json(),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    format: json(),
    maxsize: 5242880,
    maxFiles: 5
  }));

  logger.exceptions.handle(
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  );

  logger.rejections.handle(
    new winston.transports.File({ filename: 'logs/rejections.log' })
  );
}

// Create Morgan stream that writes to Winston
const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Morgan middleware configuration
const morganMiddleware = morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  { stream: morganStream }
);

export { morganMiddleware };
export default logger;

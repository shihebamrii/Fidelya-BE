import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';

/**
 * Configure and return security middleware array
 */
const securityMiddleware = () => {
  const middlewares = [];

  // Helmet - sets various HTTP headers for security
  middlewares.push(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration
  const corsOptions = {
    origin: (origin, callback) => {
      // In production, vercel.json handles headers, but we keep this as a secondary layer
      const allowedOrigins = [
        'https://fidelya-roan.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4000',
        'http://localhost:5174'
      ];
      
      const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || [];
      const allAllowed = [...allowedOrigins, ...envOrigins];

      if (!origin || allAllowed.includes(origin) || origin.endsWith('.vercel.app') || allAllowed.includes('*')) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400
  };
  middlewares.push(cors(corsOptions));

  // MongoDB query sanitization - prevents NoSQL injection
  middlewares.push(
    mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        console.warn(`Sanitized key: ${key} in request to ${req.originalUrl}`);
      }
    })
  );

  return middlewares;
};

export default securityMiddleware;

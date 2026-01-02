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
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      
      // Allow all Vercel subdomains (frontend and potential preview deployments)
      const isVercel = origin.endsWith('.vercel.app');
      // Allow localhost for development
      const isLocal = origin.startsWith('http://localhost:');
      
      // Check for environment-defined origins
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || [];
      const isExplicitlyAllowed = allowedOrigins.includes(origin);

      if (isVercel || isLocal || isExplicitlyAllowed || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Idempotency-Key', 
      'X-Requested-With', 
      'Accept', 
      'Origin',
      'Access-Control-Allow-Origin'
    ],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials: true,
    optionsSuccessStatus: 200, // Some older browsers/proxies prefer 200 over 204
    maxAge: 86400 // 24 hours
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

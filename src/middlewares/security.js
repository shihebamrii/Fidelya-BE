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
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = process.env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGINS?.split(',') || ['https://fidelya-roan.vercel.app'])
        : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4000']; 

      // Support wildcard/subdomain matching or exact match
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (allowedOrigin === '*') return true;
        if (allowedOrigin === origin) return true;
        // Basic regex for subdomain support if someone enters *.vercel.app
        if (allowedOrigin.includes('*')) {
          const regex = new RegExp('^' + allowedOrigin.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
          return regex.test(origin);
        }
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        // Instead of error, we can just say no, but returning an empty callback 
        // usually prevents the Access-Control-Allow-Origin header from being set
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials: true,
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

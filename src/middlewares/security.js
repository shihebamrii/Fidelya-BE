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
      
      let allowedOrigins = [];
      if (process.env.NODE_ENV === 'production') {
        const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean);
        allowedOrigins = (envOrigins && envOrigins.length > 0) 
          ? envOrigins 
          : ['https://fidelya-roan.vercel.app'];
      } else {
        allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4000'];
      }

      // Support wildcard/subdomain matching or exact match
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (allowedOrigin === '*') return true;
        if (allowedOrigin === origin) return true;
        
        // Basic regex for subdomain support if someone enters *.vercel.app
        if (allowedOrigin.includes('*')) {
          const pattern = allowedOrigin.replace(/\./g, '\\.').replace(/\*/g, '.*');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(origin);
        }
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        // Log forbidden origins to help debug
        console.warn(`CORS blocked origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'Accept', 'Origin'],
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

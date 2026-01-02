import 'dotenv/config';
import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import connectDB from './config/db.js';
import logger, { morganMiddleware } from './config/logger.js';
import {
  securityMiddleware,
  generalLimiter,
  notFoundHandler,
  errorHandler
} from './middlewares/index.js';
import {
  authRoutes,
  adminRoutes,
  businessRoutes,
  clientRoutes
} from './routes/index.js';

const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Loyalty Card SaaS API',
      version: '1.0.0',
      description: 'Production-ready backend for a SaaS that manages loyalty cards',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: process.env.APP_BASE_URL || 'http://localhost:4000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Admin', description: 'Admin-only endpoints' },
      { name: 'Business', description: 'Business user endpoints' },
      { name: 'Client', description: 'Public client endpoints' }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Apply security middleware (CORS, Helmet, etc.)
securityMiddleware().forEach((middleware) => app.use(middleware));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging
app.use(morganMiddleware);

// Rate limiting (general)
app.use(generalLimiter);

// Swagger UI - Only in non-production
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Loyalty Card API Docs'
  }));

  // Swagger JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.json(swaggerSpec);
  });
}

// Middleware to ensure DB connection (Lazy connection for serverless)
let dbConnected = false;
app.use(async (req, res, next) => {
  if (req.path === '/healthz') return next();
  
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
      next();
    } catch (error) {
      logger.error('Database connection failed in middleware:', error);
      // Don't call next(error) if we want to custom handle or just let it time out
      // On Vercel, it's better to report the error properly
      res.status(503).json({
        status: 'error',
        message: 'Service Temporarily Unavailable (Database Connection Failed)',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } else {
    next();
  }
});

// Health check endpoint (moved up to avoid DB dependency for basic health)
app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dbConnected
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/client', clientRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server function (for local dev)
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    try {
      await connectDB();
      dbConnected = true;
      const PORT = process.env.PORT || 4000;
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        logger.info(`API Docs available at http://localhost:${PORT}/api-docs`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
};

// Execute startServer (won't block export)
startServer();

export default app;

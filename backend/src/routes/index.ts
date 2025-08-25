import { Router } from 'express';
import { createHealthController } from '../controllers/health.controller';

// Lazy controller getter
let healthController: any = null;
const getHealthController = () => {
  if (!healthController) {
    healthController = createHealthController();
  }
  return healthController;
};
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import contactRoutes from './contact.routes';
import appConfig from '../config/app.config';

const router = Router();

// Health check routes (no prefix)
router.get('/health', (req, res, next) => getHealthController().health(req, res, next));
router.get('/health/liveness', (req, res, next) => getHealthController().liveness(req, res, next));
router.get('/health/readiness', (req, res, next) => getHealthController().readiness(req, res, next));
router.get('/health/info', (req, res, next) => getHealthController().info(req, res, next));

// API routes with version prefix
const apiRouter = Router();

// Mount route modules
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/contacts', contactRoutes);

// API info endpoint
apiRouter.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'ConnectKit API',
      version: process.env.npm_package_version || '1.0.0',
      environment: appConfig.get('nodeEnv'),
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        auth: `${appConfig.getApiUrl()}/auth`,
        users: `${appConfig.getApiUrl()}/users`,
        contacts: `${appConfig.getApiUrl()}/contacts`,
      },
      documentation: {
        swagger: appConfig.get('features').swagger ? `${appConfig.getApiUrl()}/docs` : null,
        postman: `${appConfig.getApiUrl()}/docs/postman`,
      },
    },
  });
});

// 404 handler for API routes
apiRouter.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      type: 'NotFoundError',
      message: `API endpoint ${req.method} ${req.originalUrl} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
    },
  });
});

// Mount API router with version prefix
router.use(appConfig.getApiUrl(), apiRouter);

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ConnectKit API Server',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    links: {
      health: '/health',
      api: appConfig.getApiUrl(),
      documentation: appConfig.get('features').swagger ? `${appConfig.getApiUrl()}/docs` : null,
    },
  });
});

// Global 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      type: 'NotFoundError',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
      suggestion: `Try accessing the API at ${appConfig.getApiUrl()}`,
    },
  });
});

export default router;
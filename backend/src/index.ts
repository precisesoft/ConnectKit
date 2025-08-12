#!/usr/bin/env node

/**
 * ConnectKit API Server Entry Point
 * 
 * This is the main entry point for the ConnectKit API server.
 * It starts the HTTP server and handles initialization.
 */

import { startServer } from './server';
import { logger } from './utils/logger';

// Log application startup
logger.info('Starting ConnectKit API Server...', {
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  pid: process.pid,
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
});

// Start the server
startServer()
  .then((server) => {
    logger.info('Server started successfully', {
      address: server.address(),
      pid: process.pid,
    });
  })
  .catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });

// Log process information
process.on('exit', (code) => {
  logger.info('Process exiting', { code });
});

// Handle warnings
process.on('warning', (warning) => {
  logger.warn('Process warning:', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack,
  });
});

export default startServer;
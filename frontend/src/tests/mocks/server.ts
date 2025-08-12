import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create MSW server with default handlers
export const server = setupServer(...handlers);

// Export handlers for individual test customization
export { handlers } from './handlers';
require('@testing-library/jest-dom');
require('whatwg-fetch');
const { TextEncoder, TextDecoder } = require('util');

// Polyfill for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock environment variables
process.env.SERVICE_MODE = 'mock';
process.env.FLAG_VERBOSE_LOGGING = 'false';
process.env.FLAG_USE_MOCK_THEMES = 'true';
process.env.FLAG_USE_MOCK_AI = 'true';

// Suppress console output in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
};

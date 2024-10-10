module.exports = {
  preset: 'ts-jest/presets/js-with-babel',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/+(*.)+(spec|test).+(ts)?(x)'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  testEnvironment: 'jsdom',
  collectCoverage: true,
  coveragePathIgnorePatterns: ['/node_modules', '/tests/'],
  coverageReporters: ['text', 'json-summary', 'lcov'],
  verbose: true
};

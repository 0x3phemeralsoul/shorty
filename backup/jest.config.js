module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!coverage/**',
    '!node_modules/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  verbose: true,
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 5000,
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  roots: ['<rootDir>/src', '<rootDir>/__tests__']
}; 
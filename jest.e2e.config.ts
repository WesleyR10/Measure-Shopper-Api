import type { Config } from 'jest';

const config: Config = {
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", {}],
  },
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  testEnvironment: "jest-environment-node",
  modulePathIgnorePatterns: ['dist', 'node_modules', 'coverage'],
  testMatch: ['**/*.e2e.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};

export default config;
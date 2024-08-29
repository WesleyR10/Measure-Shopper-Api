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
};

export default config;
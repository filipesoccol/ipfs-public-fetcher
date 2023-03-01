module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  rootDir: ".",
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
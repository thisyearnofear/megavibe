module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.cjs'],
  setupFilesAfterEnv: ['./jest.setup.cjs'], // Add this line
};
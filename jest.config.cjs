module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.cjs'],
  setupFilesAfterEnv: ['./jest.setup.cjs'], // add this line
};
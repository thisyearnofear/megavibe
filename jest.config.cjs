// jest.config.cjs 

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.cjs'],
  setupFilesAfterEnv: ['./jest.setup.cjs', './testSetup.cjs'],
  setupFiles: ['./setup-tests.cjs'], // Add this line

};
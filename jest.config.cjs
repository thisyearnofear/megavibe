// jest.config.cjs 

require('dotenv').config(); 

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.cjs'],
  setupFilesAfterEnv: ['./jest.setup.cjs', './testSetup.cjs'],
};
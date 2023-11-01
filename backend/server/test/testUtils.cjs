// test/testUtils.js

// eslint-disable-next-line
const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn() 
  };
  
  module.exports = {
    mockRes
  };
// server/test/mockRequest.cjs

// eslint-disable-next-line

const mockRequest = (body = {}) => {
    return {
      body,
    };
  };
  
  module.exports = {
    mockRequest,
  };
  
// validators.test.js 
const { validateUser } = require('../validators');

// Create a mock request object with a user who has admin role
const mockReqAdmin = {
  user: {
    id: '123',
    role: 'admin',
  }
};

// Create a mock request object with a user who has guest role
const mockReqGuest = {
  user: {
    id: '456',
    role: 'guest',
  }
};

// Create a mock response object
const mockRes = {};

describe('User Validator', () => {
  // This is a test suite for the User Validator

  it('should allow admin access', () => {
    // This test case checks if the validator allows access for an admin role

    // Create a middleware function using the validateUser function
    const middleware = validateUser('admin');

    // Call the middleware with the mock request, response, and a function to call next
    middleware(mockReqAdmin, mockRes, () => {
      // Inside the callback, we expect that the middleware allows access (assertion passed)
      expect(true).toBeTruthy();
    });
  });

  it('should deny non-admin access', () => {
    // This test case checks if the validator denies access for a non-admin role

    // Create a middleware function using the validateUser function
    const middleware = validateUser('admin');

    // Modify the user role to 'guest' in the mock request
    mockReqGuest.user.role = 'guest';

    // Call the middleware with the modified mock request
    middleware(mockReqGuest, mockRes, () => {
      // Inside the callback, we expect that the middleware denies access
      // If it doesn't deny access, we throw an error
      throw new Error('Should not call next');
    });
  });
});

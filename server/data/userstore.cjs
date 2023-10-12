// userStore.cjs
const users = {}; // Object to store user data

// Function to add a user to the store
const addUser = (userId, userData) => {
  users[userId] = userData;
};

// Function to retrieve user data by userId
const getUserData = (userId) => {
  return users[userId];
};

module.exports = { addUser, getUserData };

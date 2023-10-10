const path = require('path');
const fs = require('fs');

function loadRoutes(app) {
  const routesDir = path.join(__dirname, 'routes');
  console.log('Loading routes...'); // Add this line


  fs.readdirSync(routesDir).forEach((file) => {
    if (file.endsWith('.cjs')) {
      try {
        const routeHandler = require(path.join(routesDir, file));
        const routeName = file.split('.')[0];

        // Mount the API router under /api
        app.use(`/api/${routeName}`, routeHandler);
        console.log(`Route loaded: /api/${routeName}`); // Add this line

      } catch (error) {
        console.error(`Error loading route from file ${file}:`, error);
      }
    }
  });
}

module.exports = loadRoutes;

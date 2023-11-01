const path = require('path');
const fs = require('fs');

function loadRoutes(app) {
  const routesDir = path.join(__dirname, 'routes');
  const loadedRoutes = [];

  console.log('Loading routes...');

  fs.readdirSync(routesDir).forEach((file) => {
    if (file.endsWith('.cjs')) {
      try {
        const routeHandler = require(path.join(routesDir, file));
        const routeName = file.split('.')[0];

        // Mount the API router under /api
        app.use(`/api/${routeName}`, routeHandler);
        loadedRoutes.push({ path: `/api/${routeName}`, handler: routeHandler });

        console.log(`Route loaded: /api/${routeName}`);
      } catch (error) {
        console.error(`Error loading route from file ${file}:`, error);
      }
    }
  });

  return loadedRoutes;
}

module.exports = loadRoutes;

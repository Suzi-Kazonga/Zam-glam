import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // The Vite dev server's port (vite.config.js). Override with --config baseUrl=... to
    // run against a second copy of the site pointed at a test database.
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*.cy.js',
    // The specs share no custom commands, so there is no support file to load.
    supportFile: false,
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
});

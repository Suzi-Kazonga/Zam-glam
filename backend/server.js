// `node server.js` from the backend folder is the obvious thing to type, and it used to
// fail because the real entry point lives in src/. This starts it either way; `npm run
// dev` and `npm start` go to the same place.
import './src/server.js';

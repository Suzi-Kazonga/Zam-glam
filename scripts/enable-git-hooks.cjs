// Points git at the project's own hooks in .githooks/.
//
// Git does not carry hook settings in the repository, so each copy has to be told once.
// This runs from `npm install` and `npm run dev` — things everybody already does — so
// nobody has to remember it. From then on, every pull or merge repairs the demo account
// logins by itself (see .githooks/post-merge).
//
// It must never stop the app from starting: if git is missing, or this is not a git
// checkout, it does nothing.

const { execSync } = require('child_process');
const path = require('path');

try {
  const root = execSync('git rev-parse --show-toplevel', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  const current = (() => {
    try {
      return execSync('git config core.hooksPath', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
      return '';
    }
  })();

  if (current !== '.githooks') {
    execSync('git config core.hooksPath .githooks', { cwd: root, stdio: 'ignore' });
    console.log(`Git hooks enabled in ${path.basename(root)}: demo logins are repaired after every pull.`);
  }
} catch {
  // Not a git checkout, or no git: nothing to do.
}

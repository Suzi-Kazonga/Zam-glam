import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from '@babel/parser';

// A comment must never change what the code does.
//
// This is here because it once did. While adding explanatory comments across the project,
// eight of them were placed above a `CREATE TABLE` line — but that line sits inside a
// template literal, so the text became part of the SQL rather than a comment. The schema
// stopped parsing and 171 tests failed at once, every one of them complaining about
// "SQL syntax near '// Product categories'".
//
// Nothing about that was obvious from reading the diff, so it is checked automatically
// instead: Babel reports real comments separately from the contents of strings, so any
// line that LOOKS like a comment but is not in Babel's list is sitting inside one.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_ROOT = path.join(__dirname, '../../src');

// Every .js file under src/.
function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith('.js') ? [full] : [];
  });
}

const files = sourceFiles(SOURCE_ROOT);
const relative = (file) => path.relative(SOURCE_ROOT, file).replace(/\\/g, '/');

describe('Comments do not change what the code does', () => {
  test('there is something to check', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  test.each(files.map((file) => [relative(file), file]))('%s parses, and every comment is really a comment', (name, file) => {
    const source = fs.readFileSync(file, 'utf8');

    const ast = parse(source, { sourceType: 'module', plugins: ['importAssertions'] });

    // Which lines Babel considers part of a genuine comment.
    const commentLines = new Set();
    for (const comment of ast.comments || []) {
      for (let line = comment.loc.start.line; line <= comment.loc.end.line; line += 1) {
        commentLines.add(line);
      }
    }

    // Any line that starts with // but is not one of those is inside a string.
    const stranded = source
      .split(/\r?\n/)
      .map((text, index) => ({ line: index + 1, text }))
      .filter(({ text }) => /^\s*\/\//.test(text))
      .filter(({ line }) => !commentLines.has(line))
      .map(({ line, text }) => `${name}:${line} ${text.trim()}`);

    expect(stranded).toEqual([]);
  });
});

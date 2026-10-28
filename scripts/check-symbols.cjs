/** NBDT: fail the release build when a TSX symbol is missing or accessed before initialization.
 * Vite transpiles TypeScript without TypeScript semantic checking, so missing
 * React icons (e.g. <Users />) otherwise reach production as runtime errors.
 */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const files = ['index.tsx', ...fs.readdirSync('src').filter(name => name.endsWith('.tsx')).map(name => path.join('src', name))];
const options = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  noEmit: true,
  allowJs: true,
  skipLibCheck: true,
  types: [],
  noResolve: true,
};
const program = ts.createProgram(files, options);
// Vite strips types without semantic checking. Catch undeclared imports and temporal
// dead-zone accesses that throw at render time, even when TSX syntax is valid.
const fatalCodes = new Set([2304, 2552, 2448, 2454]);
const missingSymbols = [
  ...program.getSyntacticDiagnostics(),
  ...program.getSemanticDiagnostics().filter(item => fatalCodes.has(item.code)),
];
if (missingSymbols.length) {
  for (const diagnostic of missingSymbols) {
    const location = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start || 0);
    const position = diagnostic.file ? `${diagnostic.file.fileName}:${(location?.line || 0) + 1}` : '(project)';
    console.error(`${position} TS${diagnostic.code} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`);
  }
  console.error('Build blocked: an undefined symbol or use-before-initialization can crash every page at runtime.');
  process.exit(1);
}
console.log(`Runtime-symbol and initialization preflight passed (${files.length} TSX files).`);

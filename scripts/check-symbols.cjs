/** NBDT: fail the release build when a TSX symbol is referenced without an import.
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
const missingSymbols = ts.getPreEmitDiagnostics(program).filter(item => item.code === 2304 || item.code === 2552);
if (missingSymbols.length) {
  for (const diagnostic of missingSymbols) {
    const location = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start || 0);
    const position = diagnostic.file ? `${diagnostic.file.fileName}:${(location?.line || 0) + 1}` : '(project)';
    console.error(`${position} TS${diagnostic.code} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`);
  }
  console.error('Build blocked: undefined UI symbols can crash every page at runtime.');
  process.exit(1);
}
console.log(`Symbol preflight passed (${files.length} TSX files).`);

const fs=require('node:fs');const path=require('node:path');const ts=require('typescript');
let errors=0;
for(const file of ['index.tsx','src/workspace.tsx','src/enhancements.tsx','vite.config.ts']){
 const source=fs.readFileSync(file,'utf8');const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 for(const d of ast.parseDiagnostics){errors++;console.log(file,ts.flattenDiagnosticMessageText(d.messageText,' '));}
 console.log(file+': '+ast.parseDiagnostics.length+' syntax errors');
}
process.exitCode=errors?1:0;

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync(new URL(name,import.meta.url),'utf8');
const jsx=read('../src/assignment-page-v052.tsx');
const css=read('../nbdt-assignment-v052.css');
const scoped=css.split('/* v0.6.116 —')[1]??'';

test('approved hierarchy is scoped only to Assignment',()=>{
 assert.match(jsx,/nb52-page nb54-page nb114-page nb116-page/);
 assert.match(css,/\.nb116-page \.nb52-assignment-name\{[^}]*font-weight:400;[^}]*color:#52627d/);
 assert.match(css,/\.nb116-page \.nb52-project-row\{[^}]*font-weight:400;[^}]*color:#667b98/);
 assert.match(scoped,/\.nb116-page \.nb52-pencil/);
});
test('original avatars H S D A keep identical 28px shape and lettering',()=>{
 assert.match(css,/\.nb52-avatar\{[^}]*width:28px;height:28px;[^}]*font-size:13px/);
 assert.doesNotMatch(scoped,/\.nb52-avatar/);
 assert.match(jsx,/<div className="nb52-avatar" aria-hidden="true">\{person\.name\[0\]\}<\/div>/);
});
test('the approved project column is understated and has icons',()=>{
 assert.match(jsx,/<Layers3 size=\{13\} aria-hidden="true"\/>Project/);
 assert.match(jsx,/<Folder size=\{12\} aria-hidden="true"\/>Project \{row\}/);
 assert.match(css,/\.nb116-page \.nb52-table th\.nb52-project-th/);
});
test('the grid navigation, draggable tasks and editing are untouched',()=>{
 assert.match(jsx,/assignmentPageStarts\(people\.length,isAdmin,viewport\.visibleColumns\)/);
 assert.match(jsx,/onClick=\{\(\)=>navigateColumns\(-1\)\}/);
 assert.match(jsx,/onClick=\{\(\)=>navigateColumns\(1\)\}/);
 assert.match(jsx,/\{\.\.\.listeners\} \{\.\.\.attributes\}/);
 assert.match(jsx,/aria-label=\{`Edit \$\{item\.name\}`\}/);
 assert.match(css,/\.nb52-project-row\{[^}]*height:49px/);
 assert.match(css,/\.nb114-page \.nb52-person,\.nb114-page \.nb52-cell/);
});
test('empty cell remains actionable; subtle edit buttons can be focused',()=>{
 assert.match(jsx,/className="nb52-add-in-cell"/);
 assert.match(css,/\.nb116-page \.nb52-add-in-cell::before/);
 assert.match(css,/\.nb116-page \.nb52-pencil:focus-visible/);
 assert.match(css,/\.nb116-page \.nb52-cell-drop \.nb52-assignment-item/);
});

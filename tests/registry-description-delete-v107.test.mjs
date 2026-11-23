import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registryCardFields,registryVisibleDescription,registryVisualType} from '../src/registry-metadata.mjs';
import {deleteRegistrySystem} from '../src/registry-delete.mjs';

const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-registry-v107.css',import.meta.url),'utf8');

test('Description editor uses exactly the currently visible saved description',()=>{
 const sys={id:'one',name:'Crew Debit Kiosk',description:'Crew Debit system enables purchases.\nIncludes payroll reports.'};
 assert.equal(registryVisibleDescription(sys),registryCardFields(sys).description);
 assert.equal(registryVisibleDescription(sys),'Crew Debit system enables purchases.\nIncludes payroll reports.');
 assert.match(app,/setDescriptionDraft\(description\);setDescriptionError\(''\)/);
 assert.match(app,/value=\{descriptionDraft\}/);
 assert.match(app,/onUpdateDescription\(sys\.id,descriptionDraft\)/);
});

test('Default legacy card description is also the initial editable value',()=>{
 const sys={id:'two',name:'Stateroom App',deviceCategory:'Tablet',description:''};
 assert.equal(registryVisualType(sys),'Tablet');
 assert.equal(registryVisibleDescription(sys),'Tablet configuration and deployment guide.');
 assert.match(app,/useState\(\(\)=>registryVisibleDescription\(sys\)\)/);
 assert.match(app,/const description = registryVisibleDescription\(sys\)/);
});

test('Delete trash is displayed to the LEFT of pencil only while editing',()=>{
 assert.match(app,/\{editingDescription&&<button type="button" className="nb107-card-trash-icon"/);
 assert.match(app,/className="nb107-card-trash-icon"[\s\S]*<Trash2 size=\{16\}\/><\/button>\}\s*<button className="nb-card-edit-icon"/);
 assert.doesNotMatch(app,/className="nb-button nb96-delete-trigger"/);
 assert.match(css,/\.nb107-card-header-actions/);
 assert.match(css,/\.nb107-card-trash-icon/);
});

test('Irreversible-deletion warning is a distinct accessible modal, not inside editor',()=>{
 const editorStart=app.indexOf('{editingDescription?<div className="nb41-card-description-edit">');
 const editorEnd=app.indexOf('</div>:<ExpandableRegistryDescription',editorStart);
 assert.ok(editorStart>=0&&editorEnd>editorStart);
 const editor=app.slice(editorStart,editorEnd);
 assert.doesNotMatch(editor,/Delete system|confirmDelete|Trash2/);
 assert.match(app,/\{confirmDelete&&createPortal\(<div className="nb107-delete-overlay"/);
 assert.match(app,/role="alertdialog" aria-modal="true"/);
 assert.match(app,/data will be permanently destroyed/);
 assert.match(app,/This action cannot be undone/);
 assert.match(app,/Keep system/);
 assert.match(app,/Yes, delete system/);
 assert.match(app,/await onDeleteSystem\(sys\.id\)/);
 assert.match(app,/if\(!isAdmin\|\|deletingSystem\|\|descriptionSaving\|\|!confirmDelete\)return/);
});

test('Deletion only removes selected system and its linked issues',()=>{
 const project={systems:[{id:'A',devices:[1],guideReview:{checks:{}}},{id:'B'}],issues:[{id:1,systemId:'A'},{id:2,systemId:'B'}],tasks:[1],members:[2]};
 const after=deleteRegistrySystem(project,'A');
 assert.deepEqual(after.systems,[project.systems[1]]);
 assert.deepEqual(after.issues,[project.issues[1]]);
 assert.strictEqual(after.tasks,project.tasks);
 assert.strictEqual(after.members,project.members);
});

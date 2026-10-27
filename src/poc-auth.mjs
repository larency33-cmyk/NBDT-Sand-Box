/** NBDT local-only POC identities. This is NOT server-side authentication.
 * All browser storage and JavaScript are controlled by the browser user.
 * Do not use this adapter for a corporate deployment or shared authorization. */
export const POC_ROOT_USERNAME = 'superadmin';
export const POC_ROOT_PASSWORD = 'NBDT-POC-2026!';
const ACCOUNTS_KEY='nbdt_poc_accounts_v047';
const SESSION_KEY='nbdt_poc_session_v047';
const te=new TextEncoder();
const normal=s=>String(s??'').trim().toLowerCase();
const cryptoApi=()=>globalThis.crypto;
const store=()=>globalThis.localStorage;
const sessions=()=>globalThis.sessionStorage;
function randomHex(bytes=16){return Array.from(cryptoApi().getRandomValues(new Uint8Array(bytes)),v=>v.toString(16).padStart(2,'0')).join('');}
function read(){try{const raw=store().getItem(ACCOUNTS_KEY);const accounts=raw?JSON.parse(raw):[];return Array.isArray(accounts)?accounts:[];}catch{return [];}}
function write(accounts){store().setItem(ACCOUNTS_KEY,JSON.stringify(accounts));}
async function derive(password,salt){const key=await cryptoApi().subtle.importKey('raw',te.encode(password),'PBKDF2',false,['deriveBits']);const bits=await cryptoApi().subtle.deriveBits({name:'PBKDF2',salt:Uint8Array.from(salt.match(/.{2}/g).map(x=>parseInt(x,16))),iterations:160000,hash:'SHA-256'},key,256);return Array.from(new Uint8Array(bits),b=>b.toString(16).padStart(2,'0')).join('');}
async function passwordRecord(password){const salt=randomHex(16);return {salt,hash:await derive(password,salt)};}
const exposed=user=>user?({id:user.id,username:user.username,name:user.name,role:user.role,enabled:user.enabled,createdAt:user.createdAt,lastLoginAt:user.lastLoginAt??null}):null;
export async function initPocAccounts(){if(store().getItem(ACCOUNTS_KEY)!==null)return;const rec=await passwordRecord(POC_ROOT_PASSWORD);write([{id:'root-poc',username:POC_ROOT_USERNAME,name:'NBDT Super Admin',role:'super_admin',enabled:true,createdAt:new Date().toISOString(),revision:1,...rec}]);}
export function listPocAccounts(){return read().map(exposed).sort((a,b)=>a.role==='super_admin'?-1:b.role==='super_admin'?1:a.username.localeCompare(b.username));}
export function currentPocUser(){let session;try{session=JSON.parse(sessions().getItem(SESSION_KEY)||'null');}catch{return null;}if(!session?.userId||!session?.token)return null;const account=read().find(x=>x.id===session.userId);if(!account?.enabled||session.revision!==account.revision)return null;return exposed(account);}
export async function loginPoc(username,password){const value=normal(username);const account=read().find(x=>normal(x.username)===value);const valid=account&&account.enabled&&(await derive(password,account.salt))===account.hash;if(!valid)throw Error('Invalid username or password.');account.lastLoginAt=new Date().toISOString();write(read().map(x=>x.id===account.id?account:x));sessions().setItem(SESSION_KEY,JSON.stringify({userId:account.id,revision:account.revision,token:randomHex(32)}));return exposed(account);}
export function logoutPoc(){sessions().removeItem(SESSION_KEY);}
function superOnly(){const actor=currentPocUser();if(actor?.role!=='super_admin')throw Error('Super Admin permission is required.');return actor;}
function validNewPassword(pass){if(typeof pass!=='string'||pass.length<12||pass.length>128)throw Error('Password must be between 12 and 128 characters.');}
export async function createPocAdmin({username,name,password}){superOnly();const user=normal(username);if(!/^[a-z0-9][a-z0-9._-]{2,49}$/.test(user))throw Error('Username: 3–50 Latin letters, numbers, dots, underscores or hyphens.');if(read().some(x=>normal(x.username)===user))throw Error('This username already exists.');if(!String(name).trim())throw Error('Enter the administrator name.');validNewPassword(password);const rec=await passwordRecord(password);const account={id:'admin-'+randomHex(12),username:user,name:String(name).trim().slice(0,80),role:'admin',enabled:true,createdAt:new Date().toISOString(),revision:1,...rec};superOnly();write([...read(),account]);return exposed(account);}
export function setPocAdminEnabled(id,enabled){superOnly();const list=read(),account=list.find(x=>x.id===id);if(!account||account.role!=='admin')throw Error('Only Admin accounts can be changed here.');account.enabled=!!enabled;account.revision++;write(list);return exposed(account);}
export async function resetPocAdminPassword(id,password){superOnly();validNewPassword(password);const list=read(),account=list.find(x=>x.id===id);if(!account||account.role!=='admin')throw Error('Only Admin passwords can be reset.');Object.assign(account,await passwordRecord(password));account.revision++;superOnly();write(list);return exposed(account);}
export async function changeOwnPocPassword(currentPassword,newPassword){const current=currentPocUser();if(!current)throw Error('Sign in first.');validNewPassword(newPassword);const list=read(),account=list.find(x=>x.id===current.id);if(!account||await derive(currentPassword,account.salt)!==account.hash)throw Error('Current password is incorrect.');Object.assign(account,await passwordRecord(newPassword));account.revision++;write(list);sessions().setItem(SESSION_KEY,JSON.stringify({userId:account.id,revision:account.revision,token:randomHex(32)}));return exposed(account);}

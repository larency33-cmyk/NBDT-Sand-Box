import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {SignInPage} from './signin-v099';
import {hasEnteredWelcome,rememberWelcomeEntry,welcomeTarget} from './signin-model-v099.mjs';

let workspaceRequest:Promise<typeof import('../index')>|null=null;
const loadWorkspace=()=>workspaceRequest??=(import('../index').then(async module=>{await module.initializeWorkspace();return module;}).catch(error=>{workspaceRequest=null;throw error;}));

function WelcomeGate(){
  const [Workspace,setWorkspace]=useState<React.ComponentType|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const alive=useRef(true),opening=useRef(false);
  const enter=useCallback(async()=>{
    if(opening.current)return;opening.current=true;setBusy(true);setError('');
    try{
      const module=await loadWorkspace();
      if(!alive.current)return;
      const target=welcomeTarget(location.href);
      if(target)history.replaceState(history.state,'',target);
      rememberWelcomeEntry(window.sessionStorage);
      setWorkspace(()=>module.Workspace);
    }catch(e){if(alive.current){setError(e instanceof Error?e.message:'Could not open the workspace. Please try again.');setBusy(false);}}
    finally{opening.current=false;}
  },[]);
  useEffect(()=>{
    alive.current=true;
    if(!/^\/signin\/?$/.test(location.pathname)&&hasEnteredWelcome(window.sessionStorage))void enter();
    return()=>{alive.current=false;};
  },[enter]);
  return Workspace?<Workspace/>:<SignInPage onEnter={()=>void enter()} busy={busy} error={error}/>;
}

createRoot(document.getElementById('root')!).render(<WelcomeGate/>);

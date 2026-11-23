import {useEffect,useRef,useState,type RefObject} from 'react';
import {NAME_CYCLE_MS} from './signin-model-v099.mjs';

/** One clock for CSS sprite motion, transport, lights and names. No frame renders. */
export function useDeploymentLoop(root:RefObject<HTMLDivElement|null>,ready:boolean,layout:string){
  const [paused,setPaused]=useState(false);
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible,setVisible]=useState(()=>!document.hidden);
  const [cycle,setCycle]=useState(0);
  const elapsed=useRef(0);
  const animations=useRef<Animation[]>([]);
  const clock=useRef({at:0,value:0,running:false});

  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion=()=>setReduced(media.matches);
    const onVisibility=()=>setVisible(!document.hidden);
    media.addEventListener('change',onMotion);
    document.addEventListener('visibilitychange',onVisibility);
    return()=>{media.removeEventListener('change',onMotion);document.removeEventListener('visibilitychange',onVisibility);};
  },[]);

  useEffect(()=>{
    if(!ready||!root.current)return;
    // Newly mounted portrait groups inherit the exact phase of the panorama.
    animations.current=root.current.getAnimations({subtree:true});
    for(const animation of animations.current){animation.pause();animation.currentTime=elapsed.current;}
    return()=>{
      const c=clock.current;
      elapsed.current=c.running?c.value+performance.now()-c.at:c.value;
      for(const animation of animations.current)animation.cancel();
      animations.current=[];
      clock.current={at:performance.now(),value:elapsed.current,running:false};
    };
  },[ready,root]);

  useEffect(()=>{
    if(!ready)return;
    const c=clock.current;
    const now=performance.now();
    const current=c.running?c.value+now-c.at:elapsed.current;
    const shouldRun=visible&&!paused&&!reduced;
    const time=reduced?10000:current;
    elapsed.current=current;
    clock.current={at:now,value:current,running:shouldRun};
    const start=Number(document.timeline.currentTime??0)-time;
    for(const animation of animations.current){
      animation.pause();animation.currentTime=time;
      if(shouldRun){animation.play();animation.startTime=start;}
    }
    let timer:ReturnType<typeof setTimeout>|undefined;
    const next=()=>{
      const value=clock.current.value+performance.now()-clock.current.at;
      setCycle(Math.floor(value/NAME_CYCLE_MS));
      timer=setTimeout(next,NAME_CYCLE_MS-(value%NAME_CYCLE_MS)+12);
    };
    if(shouldRun)next();
    return()=>{if(timer)clearTimeout(timer);};
  },[ready,layout,visible,paused,reduced]);

  return {paused,reduced,cycle,toggle:()=>setPaused(value=>!value)};
}

import React,{useLayoutEffect,useRef} from 'react';
import {ArrowRight,KeyRound} from 'lucide-react';
import {DeploymentScene,TeamLogo} from './signin-scene-v099';
import royalCaribbeanGroupLockup from './assets/royal-caribbean-group-lockup-v101.png';
import './signin-v099.css';

/**
 * Keep the illustrated panorama's geometry untouched while visually positioning
 * the CTA 30 CSS pixels above its highest visible cloud (viewBox y=0). The SVG
 * coordinate-to-screen transform accounts for object-fit and responsive scale.
 * All offsets are transforms: they never resize or push the animation scene.
 */
export function SignInPage({onEnter,busy=false,error=''}:{onEnter:()=>void;busy?:boolean;error?:string}){
  const welcomeRef=useRef<HTMLElement>(null);
  useLayoutEffect(()=>{
    const root=welcomeRef.current;
    if(!root)return;
    let frame=0;
    let disposed=false;
    const align=()=>{
      frame=0;
      if(disposed)return;
      root.style.setProperty('--nb103-button-shift','0px');
      root.style.setProperty('--nb103-copy-shift','0px');
      // Portrait deployment uses three vertically stacked scenes. Keep its
      // original spacing so the CTA never overlays the upper portrait stage.
      if(window.innerWidth<=720)return;
      const logo=root.querySelector<SVGSVGElement>('.nb99-team-logo');
      const title=root.querySelector<HTMLElement>('.nb99-hero h1');
      const subtitle=root.querySelector<HTMLElement>('.nb99-subtitle');
      const button=root.querySelector<HTMLButtonElement>('.nb99-sso');
      const scene=root.querySelector<SVGSVGElement>('.nb99-scene-canvas');
      if(!logo||!title||!subtitle||!button||!scene)return;
      const ctm=scene.getScreenCTM();
      if(!ctm)return;
      const sceneOrigin=scene.createSVGPoint();
      sceneOrigin.x=0;sceneOrigin.y=0;
      const cloudTop=sceneOrigin.matrixTransform(ctm).y;
      const logoBottom=logo.getBoundingClientRect().bottom;
      const titleBox=title.getBoundingClientRect();
      const subtitleBox=subtitle.getBoundingClientRect();
      const buttonBox=button.getBoundingClientRect();
      const targetShift=cloudTop-30-buttonBox.bottom;
      const room=buttonBox.top+targetShift-logoBottom;
      const textHeight=subtitleBox.bottom-titleBox.top;
      const minimalMargin=window.innerWidth<=720?12:16;
      // At unusually short/zoomed windows, preserve accessibility: do not
      // overlap the logo, headline or SSO button to chase a pixel-perfect gap.
      if(room<textHeight+2*minimalMargin)return;
      const textCenter=(titleBox.top+subtitleBox.bottom)/2;
      const targetCenter=(logoBottom+buttonBox.top+targetShift)/2;
      root.style.setProperty('--nb103-button-shift',`${targetShift.toFixed(2)}px`);
      root.style.setProperty('--nb103-copy-shift',`${(targetCenter-textCenter).toFixed(2)}px`);
    };
    const schedule=()=>{if(!disposed&&!frame)frame=requestAnimationFrame(align);};
    const observer=new ResizeObserver(schedule);
    observer.observe(root);
    const scene=root.querySelector('.nb99-scene-canvas');
    if(scene)observer.observe(scene);
    const logo=root.querySelector('.nb99-team-logo');
    if(logo)observer.observe(logo);
    window.addEventListener('resize',schedule);
    // Webfonts can change line heights after the first paint.
    void document.fonts?.ready.then(schedule);
    schedule();
    return()=>{disposed=true;if(frame)cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',schedule);};
  },[]);
  return <main ref={welcomeRef} className="nb99-signin" data-testid="nbdt-welcome">
    <div className="nb99-chart nb99-chart-left" aria-hidden="true"><svg viewBox="0 0 520 500"><path d="M-60 10C180 90 100-60 340 0S420 150 560 70M-70 70C180 150 130 0 350 60S430 210 570 130M-80 130C190 210 150 60 360 120S440 270 580 190M-90 190C200 270 160 120 370 180S450 330 590 250"/><text x="150" y="100">50</text><text x="185" y="180">100</text><text x="160" y="270">200</text></svg></div>
    <div className="nb99-chart nb99-chart-right" aria-hidden="true"><svg viewBox="0 0 350 350"><circle cx="280" cy="30" r="115"/><circle cx="280" cy="30" r="170"/><circle cx="280" cy="30" r="230"/><path d="m20 250 320-270M85-30l220 340M-10 80l340 30"/></svg></div>
    <header className="nb99-header"><span>NBDT <b>Hub</b></span></header>
    <section className="nb99-hero" aria-labelledby="nb99-welcome-title">
      <TeamLogo/>
      <div className="nb103-copy">
        <h1 id="nb99-welcome-title">Together, we bring ships to life.</h1>
        <p className="nb99-subtitle">From first configuration to first sailing.</p>
      </div>
      <button type="button" className="nb99-sso" onClick={onEnter} disabled={busy} aria-busy={busy}><KeyRound size={23} strokeWidth={2.5}/><span>{busy?'Opening workspace…':'Sign in with corporate SSO'}</span><ArrowRight size={23}/></button>
      {error&&<p className="nb99-entry-error" role="alert">{error}</p>}
    </section>
    <div className="nb99-panorama"><DeploymentScene/></div>
    <footer className="nb99-footer"><img className="nb101-group-lockup" src={royalCaribbeanGroupLockup} alt="Royal Caribbean Group · Royal Caribbean International · Celebrity Cruises · Silversea" width="2048" height="118" decoding="async" /></footer>
  </main>;
}

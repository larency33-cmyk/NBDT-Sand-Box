import React from 'react';
import {ArrowRight,KeyRound} from 'lucide-react';
import {DeploymentScene,TeamLogo} from './signin-scene-v099';
import './signin-v099.css';

export function SignInPage({onEnter,busy=false,error=''}:{onEnter:()=>void;busy?:boolean;error?:string}){
  return <main className="nb99-signin" data-testid="nbdt-welcome">
    <div className="nb99-chart nb99-chart-left" aria-hidden="true"><svg viewBox="0 0 520 500"><path d="M-60 10C180 90 100-60 340 0S420 150 560 70M-70 70C180 150 130 0 350 60S430 210 570 130M-80 130C190 210 150 60 360 120S440 270 580 190M-90 190C200 270 160 120 370 180S450 330 590 250"/><text x="150" y="100">50</text><text x="185" y="180">100</text><text x="160" y="270">200</text></svg></div>
    <div className="nb99-chart nb99-chart-right" aria-hidden="true"><svg viewBox="0 0 350 350"><circle cx="280" cy="30" r="115"/><circle cx="280" cy="30" r="170"/><circle cx="280" cy="30" r="230"/><path d="m20 250 320-270M85-30l220 340M-10 80l340 30"/></svg></div>
    <header className="nb99-header"><span>NBDT <b>Hub</b></span></header>
    <section className="nb99-hero" aria-labelledby="nb99-welcome-title">
      <TeamLogo/>
      <h1 id="nb99-welcome-title">Together, we bring ships to life.</h1>
      <p className="nb99-subtitle">From first configuration to first sailing.</p>
      <button type="button" className="nb99-sso" onClick={onEnter} disabled={busy} aria-busy={busy}><KeyRound size={23} strokeWidth={2.5}/><span>{busy?'Opening workspace…':'Sign in with corporate SSO'}</span><ArrowRight size={23}/></button>
      <p className="nb99-helper">Your team's deployment workspace.</p>
      {error&&<p className="nb99-entry-error" role="alert">{error}</p>}
    </section>
    <div className="nb99-panorama"><DeploymentScene/></div>
    <footer className="nb99-footer"><p className="nb99-group">ROYAL CARIBBEAN GROUP</p><div className="nb99-brands"><span>Royal Caribbean International</span><i aria-hidden="true"/><span>Celebrity Cruises</span><i aria-hidden="true"/><span>Silversea</span></div></footer>
  </main>;
}

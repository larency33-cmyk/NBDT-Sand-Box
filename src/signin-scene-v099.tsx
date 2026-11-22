import React,{useEffect,useId,useRef,useState} from 'react';
import {Pause,Play} from 'lucide-react';
import atlas from './assets/nbdt-signin-atlas-v099.png';
import {initialLandingNames,namesForCycle,readLandingNames} from './signin-model-v099.mjs';
import {useDeploymentLoop} from './signin-loop-v099';

export function TeamLogo(){return <svg className="nb99-team-logo" viewBox="545 65 580 155" role="img" aria-label="NBDT — New Build Deployment Team"><image href={atlas} width="1670" height="941"/></svg>;}

function Person({x,y,installer=false}:{x:number;y:number;installer?:boolean}){
  return <g transform={`translate(${x} ${y}) scale(${installer?2.35:2.8})`} shapeRendering="crispEdges" className="nb99-person">
    <g className="nb99-head"><path d="M6 0h10v2h3v10h-3v3H6v-2H3V3h3Z" fill="#102c59"/><path d="M7 3h8v2h2v6h-3v3H7v-3H5V5h2Z" fill="#c0e4ff"/><path d="M6 0h10v2h3v3H8v3H3V3h3Z" fill="#235085"/><path d="M8 3h7v2H8Z" fill="#5283b1"/></g>
    <path d="M7 15h10v3h4v14H4V20h3Z" fill="#133263"/><path d="M8 17h8v3h3v10H6v-9h2Z" fill="#0875ed"/><path d="M7 20h3v8H6v-6h1Z" fill="#4ca9ff"/>
    <path d="M4 30h16v4h5v5h-5v-4H4Z" fill="#173d72"/><path d="M3 35h6v7h8v3H6v-2H3Z" fill="#122e55"/>
    <g className={installer?'nb99-arm nb99-arm-install':'nb99-arm'}><path d={installer?'M16 19h5v-5h4v-3h4v4h-3v4h-3v5h-7Z':'M15 19h5v4h7v-2h4v5H18v-3h-3Z'} fill="#12315e"/><path d={installer?'M18 19h2v-4h4v-2h3v2h-2v4h-3v3h-4Z':'M17 20h2v4h9v-2h2v3H19v-2h-2Z'} fill="#b4ddff"/></g>
  </g>;
}
function WorkScreens(){return <g fill="#41d4ff" shapeRendering="crispEdges">
  {[193,340,474].map((x,i)=><g key={x} className="nb99-screen-lines" style={{animationDelay:`-${i*.2}s`}}>{[0,1,2,3].map(row=><rect key={row} x={x} y={174+row*9} width={[45,32,51,26][(row+i)%4]} height="3"/>)}</g>)}
  <path className="nb99-config-check" d="m352 192 10 10 20-23" fill="none" stroke="#00bcd8" strokeWidth="7"/>
 </g>;}
function Box({x=0,y=0}:{x?:number;y?:number}){return <g transform={`translate(${x} ${y})`} shapeRendering="crispEdges"><path d="M0 0h88v5h5v48H0Z" fill="#153768"/><path d="M4 5h82v43H4Z" fill="#e8ca98"/><path d="M7 7h28v38H7Z" fill="#f4dcaf"/><path d="M36 5h12v12H36Z" fill="#2385ee"/><path d="M58 22h6l10 11V22h7v22h-7L64 33v11h-6Z" fill="#1257ac"/><path d="M9 8h6v36H9Z" fill="#fff0d3"/></g>;}
function Delivery(){return <>
  <g className="nb99-system-ready" shapeRendering="crispEdges"><rect x="699" y="186" width="54" height="46" fill="#153b6a"/><rect x="704" y="191" width="44" height="36" fill="#e1f3ff"/><path d="m715 210 8 7 16-18" fill="none" stroke="#00c4d7" strokeWidth="5"/></g>
  <g className="nb99-pack-box"><Box x={738} y={202}/></g>
  <g className="nb99-cart" shapeRendering="crispEdges"><path d="M717 253h134v9H717v-3h-7v-55h-7v-9h10v7h6v51Z" fill="#102f60"/><path d="M721 253h126v5H721Z" fill="#609ed9"/><Box x={741} y={201}/><g className="nb99-wheel"><rect x="732" y="263" width="17" height="13" fill="#12315b"/><rect x="736" y="266" width="8" height="7" fill="#9fc8e7"/><rect x="820" y="263" width="17" height="13" fill="#12315b"/><rect x="824" y="266" width="8" height="7" fill="#9fc8e7"/></g></g>
  <g className="nb99-route-pulse"><rect x="570" y="236" width="20" height="20" fill="#c4fbff"/><rect x="575" y="241" width="10" height="10" fill="#00bfd9"/></g>
 </>;}
function NameBubble({name,x}:{name:string;x:number}){return <g transform={`translate(${x} 92)`} className="nb99-name-bubble"><title>{name}</title><path d="M0 0h116v6h6v29h-6v5H53l-7 7v-7H0v-5h-6V6h6Z" fill="#d0e5fa"/><path d="M1 1h113v5h5v27h-5v5H1v-5h-5V6h5Z" fill="#fff"/><circle cx="17" cy="19" r="12" fill="#0066f5"/><text x="17" y="24" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700">{name.charAt(0)}</text><text x="36" y="24" fill="#081c4a" fontSize={name.length>10?'13':'16'} fontWeight="600">{name.length>12?name.slice(0,11)+'…':name}</text></g>;}

export function DeploymentScene(){
  const root=useRef<HTMLDivElement>(null);
  const unique=useId().replace(/:/g,'');
  const [ready,setReady]=useState(false);
  const [portrait,setPortrait]=useState(()=>matchMedia('(max-width: 720px)').matches);
  const [people,setPeople]=useState<string[]>(initialLandingNames);
  const {paused,reduced,cycle,toggle}=useDeploymentLoop(root,ready,portrait?'portrait':'panorama');
  const latestPeople=useRef(people);latestPeople.current=people;
  const [shown,setShown]=useState(()=>namesForCycle(people,0));
  useEffect(()=>setShown(namesForCycle(latestPeople.current,cycle)),[cycle]);
  useEffect(()=>{if(!ready)setShown(namesForCycle(people,cycle));},[people,ready,cycle]);
  useEffect(()=>{
    let live=true;
    const img=new Image();img.src=atlas;
    Promise.all([img.decode().catch(()=>{}),readLandingNames()]).then(([,names])=>{
      if(live){setPeople(names);setShown(namesForCycle(names,0));setReady(true);}
    });
    const media=matchMedia('(max-width: 720px)');const resize=()=>setPortrait(media.matches);
    media.addEventListener('change',resize);
    return()=>{live=false;media.removeEventListener('change',resize);};
  },[]);
  const clips=[{key:'configure',from:0,width:570},{key:'deliver',from:570,width:480},{key:'deploy',from:1050,width:620}];
  const transform=(key:string)=>!portrait?undefined:key==='configure'?'translate(20 -65)':key==='deliver'?'translate(-550 210)':'translate(-1050 560)';
  return <div ref={root} className={`nb99-scene ${ready?'is-ready':''} ${portrait?'is-portrait':''}`} data-testid="deployment-scene" data-cycle={cycle}>
    <svg className="nb99-scene-canvas" viewBox={portrait?'0 0 620 940':'0 0 1670 370'} role="img" aria-labelledby={`${unique}-title ${unique}-desc`}>
      <title id={`${unique}-title`}>One team, from configuration to deployment</title>
      <desc id={`${unique}-desc`}>A pixel-art team configures computers, packs a system, delivers it to a cruise ship and installs it. Team names are drawn from the local Assignment directory.</desc>
      <defs>{clips.map(c=><clipPath key={c.key} id={`${unique}-${c.key}`}><rect x={c.from} y="0" width={c.width} height="325"/></clipPath>)}</defs>
      {portrait&&<path d="M13 150v700" stroke="#a4caed" strokeWidth="3" strokeDasharray="5 8"/>}
      {clips.map((c,index)=><g key={c.key} transform={transform(c.key)} className={`nb99-phase nb99-phase-${c.key}`}>
        <g clipPath={`url(#${unique}-${c.key})`}><image href={atlas} x="0" y="-470" width="1670" height="941"/></g>
        {c.key==='configure'&&<><WorkScreens/><Person x={126} y={154}/><Person x={276} y={154}/><Person x={424} y={154}/>{[0,1,2].map(i=><g key={i} visibility={shown[i]?'visible':'hidden'}><NameBubble name={shown[i]||''} x={[145,295,445][i]}/></g>)}</>}
        {c.key==='deliver'&&<Delivery/>}
        {c.key==='deploy'&&<><Person x={1326} y={174} installer/><g className="nb99-installed-check"><rect x="1433" y="186" width="23" height="22" fill="#e4fcff"/><path d="m1437 196 6 6 12-15" stroke="#00bbce" strokeWidth="5" fill="none"/></g><g className="nb99-rack-lights" fill="#58f3ff">{[0,1,2,3].map(i=><rect key={i} x="1382" y={183+i*14} width="8" height="4"/>)}</g></>}
        <g className="nb99-water" fill="#d9f5ff" shapeRendering="crispEdges">{[0,1,2,3,4].map(i=><rect key={i} x={c.from+25+i*c.width/5} y={294+(i%2)*11} width={26+(i%3)*8} height="3"/>)}</g>
        <text x={c.from+c.width/2} y="348" textAnchor="middle" className="nb99-phase-label"><tspan fill="#0066f5">0{index+1}</tspan><tspan dx="14">{['Configure','Deliver','Deploy'][index]}</tspan></text>
      </g>)}
    </svg>
    <button className="nb99-motion-toggle" type="button" onClick={toggle} disabled={reduced} aria-label={reduced?'Animation reduced by system preference':paused?'Play animation':'Pause animation'} aria-pressed={paused||reduced} title={reduced?'Reduced motion':paused?'Play animation':'Pause animation'}>{paused||reduced?<Play size={14}/>:<Pause size={14}/>}</button>
  </div>;
}

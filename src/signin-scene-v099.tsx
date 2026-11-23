import React,{useEffect,useId,useRef,useState} from 'react';
import {Pause,Play} from 'lucide-react';
import atlas from './assets/nbdt-signin-atlas-v099.png';
import sprites from './assets/nbdt-signin-sprites-v100.png';
import {initialLandingNames,namesForCycle,readLandingNames} from './signin-model-v099.mjs';
import {useDeploymentLoop} from './signin-loop-v099';

export function TeamLogo(){return <svg className="nb99-team-logo" viewBox="545 65 580 155" role="img" aria-label="NBDT — New Build Deployment Team"><image href={atlas} width="1670" height="941"/></svg>;}

type SpriteRect=[number,number,number,number];
const rectPath=([x,y,w,h]:SpriteRect)=>`M${x} ${y}h${w}v${h}h-${w}Z`;
const PEOPLE_SPRITES:{body:SpriteRect;head:SpriteRect;arm:SpriteRect}[]=[
  {body:[124,150,91,131],head:[131,150,54,48],arm:[166,207,49,32]},
  {body:[265,150,90,131],head:[273,150,54,48],arm:[309,207,46,32]},
  {body:[397,150,90,131],head:[405,150,54,48],arm:[441,207,46,32]},
  {body:[1306,170,78,98],head:[1314,170,48,38],arm:[1344,208,40,31]},
];
function Person({index,installer=false}:{index:number;installer?:boolean}){
  const id=useId().replace(/:/g,'');
  const {body,head,arm}=PEOPLE_SPRITES[index];
  const picture=<image href={sprites} x="0" y="-470" width="1671" height="941"/>;
  return <g className="nb99-person" data-sprite-person={index}>
    <defs>
      <clipPath id={`${id}-body`}><path d={rectPath(body)+rectPath(head)+rectPath(arm)} clipRule="evenodd"/></clipPath>
      <clipPath id={`${id}-head`}><path d={rectPath(head)}/></clipPath>
      <clipPath id={`${id}-arm`}><path d={rectPath(arm)}/></clipPath>
    </defs>
    <g clipPath={`url(#${id}-body)`}>{picture}</g>
    <g className="nb99-head"><g clipPath={`url(#${id}-head)`}>{picture}</g></g>
    <g className={installer?'nb99-arm nb99-arm-install':'nb99-arm'}><g clipPath={`url(#${id}-arm)`}>{picture}</g></g>
  </g>;
}

/** The reference's layered, stepped coastline and clouds remain separate from UI. */
function PixelLandscape(){return <g className="nb100-landscape" aria-hidden="true" shapeRendering="crispEdges">
  <path d="M-20 166h30v-9h30v-12h27v-10h35v12h30v8h26v15h40v-8h35v-12h30v8h30v12h45v18h50v-10h35v-9h28v12h40v14h40v-9h35v-10h38v-10h35v12h26v10h42v-8h30v-12h30v-10h45v15h28v14h35v11h48v-13h35v-15h29v-13h33v-11h36v12h31v9h40v12h35v-6h40v-13h35v-12h30v13h30v12h36v-8h30v-12h35v-10h30v15h40v12h45v-8h37v-13h30v12h30v13h50v-7h40v-9h35v15h45v-10h40v11h55v92H-20Z" fill="#e1eefa"/>
  <path d="M-20 215h47v-13h35v-8h31v11h37v13h36v-7h35v-10h32v13h45v12h35v-8h40v-12h35v-8h32v9h30v12h40v9h42v-12h28v-15h31v-11h34v13h32v12h40v11h45v-7h38v-12h30v-8h35v9h33v10h43v10h45v-10h33v-12h38v-11h32v12h35v12h50v9h45v-12h30v-14h37v-10h31v11h39v12h50v10h40v-8h37v-13h29v11h45v10h50v-8h40v-8h40v10h50v-7h50v82H-20Z" fill="#cfe4f9"/>
  <path d="M-20 258h70v-8h44v-6h45v7h55v9h60v-7h45v-8h45v8h60v9h70v-8h45v-6h50v8h80v8h55v-7h55v-8h45v9h75v7h60v-8h50v-7h45v9h70v8h60v-8h55v-6h50v8h65v7h65v-7h45v-7h55v9h65v7h70v-8h50v-7h50v8h95v49H-20Z" fill="#b7d6f3" opacity=".8"/>
  <g className="nb100-clouds nb101-cloud-track">
    {[0,-1670].map(offset=><g key={offset} transform={`translate(${offset} 0)`}>
      {[[80,-54,1],[292,9,.55],[505,39,.45],[770,61,.35],[1185,8,.5],[1478,-48,.85]].map(([x,y,scale],i)=><g key={i} transform={`translate(${x} ${y}) scale(${scale})`}>
        <path d="M0 40h15V29h22V18h20V6h24V0h28v10h17v13h24v9h20v8h15v8H0Z" fill="#d9eafb" opacity=".8"/>
        <path d="M0 34h15V24h22V14h20V3h24v-6h28v10h17v13h24v9h20v8h15v5H0Z" fill="#fbfdff"/>
        <path d="M42 29h20V18h19v-7h19v9h17v9h28v7h-28v-5H84v9H42Z" fill="#e9f4ff"/>
      </g>)}
    </g>)}
  </g>
</g>;}
function WorkScreens(){return <g fill="#41d4ff" shapeRendering="crispEdges">
  {[193,340,474].map((x,i)=><g key={x} className="nb99-screen-lines" style={{animationDelay:`-${i*.2}s`}}>{[0,1,2,3].map(row=><rect key={row} x={x} y={174+row*9} width={[45,32,51,26][(row+i)%4]} height="3"/>)}</g>)}
  <path className="nb99-config-check" d="m352 192 10 10 20-23" fill="none" stroke="#00bcd8" strokeWidth="7"/>
 </g>;}
function Box({x=0,y=0}:{x?:number;y?:number}){return <svg x={x} y={y} width="93" height="55" viewBox="870 644 100 59" overflow="hidden"><image href={sprites} width="1671" height="941"/></svg>;}
function Delivery(){return <>
  <g className="nb99-system-ready" shapeRendering="crispEdges"><rect x="699" y="186" width="54" height="46" fill="#153b6a"/><rect x="704" y="191" width="44" height="36" fill="#e1f3ff"/><path d="m715 210 8 7 16-18" fill="none" stroke="#00c4d7" strokeWidth="5"/></g>
  <g className="nb99-pack-box"><Box x={738} y={202}/></g>
  <g className="nb99-cart" data-sprite-cart="detailed"><svg x="704" y="178" width="152" height="101" viewBox="826 633 152 101" overflow="hidden"><image href={sprites} width="1671" height="941"/></svg></g>
  <g className="nb99-route-pulse"><rect x="570" y="236" width="20" height="20" fill="#c4fbff"/><rect x="575" y="241" width="10" height="10" fill="#00bfd9"/></g>
 </>;}
function RackIndicators({phase}:{phase:'configure'|'deploy'}){
  const sites=phase==='configure'
    ?[[94,[126,150,173,194,215]],[108,[126,150,173,194,215]],[634,[182,204,226]],[650,[182,204,226]]]
    :[[1379,[182,197,213,228]],[1390,[182,197,213,228]]];
  let index=0;
  return <g className="nb101-rack-indicators" aria-hidden="true" shapeRendering="crispEdges">
    {sites.flatMap(([x,ys])=>(ys as number[]).map(y=>{
      const delay=(index++%8)*.5;
      return <rect className="nb101-rack-led" key={`${x}-${y}`} x={x as number} y={y} width="6" height="4" rx=".5" style={{animationDelay:`-${delay}s`}}/>;
    }))}
  </g>;
}
function WaterHighlights({from,width}:{from:number;width:number}){
  return <g className="nb101-water-highlights" aria-hidden="true" fill="#f6feff" shapeRendering="crispEdges">
    {Array.from({length:9},(_,i)=><rect className="nb101-water-highlight" key={i} x={from+12+i*(width-35)/9} y={287+(i%3)*8} width={14+(i%4)*7} height={i%3===0?3:2} style={{animationDelay:`-${(i%5)*.8}s`}}/>)}
  </g>;
}
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
    const images=[atlas,sprites].map(src=>{const img=new Image();img.src=src;return img.decode().catch(()=>{});});
    Promise.all([Promise.all(images),readLandingNames()]).then(([,names])=>{
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
      <defs>{clips.map(c=>{
        const skyTop=portrait?(c.key==='configure'?0:c.key==='deliver'?115:35):-140;
        return <React.Fragment key={c.key}><clipPath id={`${unique}-${c.key}`}><rect x={c.from} y="0" width={c.width} height="325"/></clipPath><clipPath id={`${unique}-${c.key}-sky`}><rect x={c.from} y={skyTop} width={c.width} height={325-skyTop}/></clipPath></React.Fragment>;
      })}</defs>
      {portrait&&<path d="M13 150v700" stroke="#a4caed" strokeWidth="3" strokeDasharray="5 8"/>}
      {clips.map((c,index)=><g key={c.key} transform={transform(c.key)} className={`nb99-phase nb99-phase-${c.key}`}>
        <g clipPath={`url(#${unique}-${c.key}-sky)`}><PixelLandscape/></g>
        <g clipPath={`url(#${unique}-${c.key})`}><image href={atlas} x="0" y="-470" width="1670" height="941"/></g>
        {c.key==='configure'&&<><WorkScreens/><RackIndicators phase="configure"/><Person index={0}/><Person index={1}/><Person index={2}/>{[0,1,2].map(i=><g key={i} visibility={shown[i]?'visible':'hidden'}><NameBubble name={shown[i]||''} x={[145,295,445][i]}/></g>)}</>}
        {c.key==='deliver'&&<Delivery/>}
        {c.key==='deploy'&&<><Person index={3} installer/><RackIndicators phase="deploy"/><g className="nb99-installed-check"><rect x="1433" y="186" width="23" height="22" fill="#e4fcff"/><path d="m1437 196 6 6 12-15" stroke="#00bbce" strokeWidth="5" fill="none"/></g></>}
        <g className="nb99-water" fill="#d9f5ff" shapeRendering="crispEdges">{[0,1,2,3,4].map(i=><rect key={i} x={c.from+25+i*c.width/5} y={294+(i%2)*11} width={26+(i%3)*8} height="3"/>)}</g>
        <WaterHighlights from={c.from} width={c.width}/>
        <text x={c.from+c.width/2} y="348" textAnchor="middle" className="nb99-phase-label"><tspan fill="#0066f5">0{index+1}</tspan><tspan dx="14">{['Configure','Deliver','Deploy'][index]}</tspan></text>
      </g>)}
    </svg>
    <button className="nb99-motion-toggle" type="button" onClick={toggle} disabled={reduced} aria-label={reduced?'Animation reduced by system preference':paused?'Play animation':'Pause animation'} aria-pressed={paused||reduced} title={reduced?'Reduced motion':paused?'Play animation':'Pause animation'}>{paused||reduced?<Play size={14}/>:<Pause size={14}/>}</button>
  </div>;
}

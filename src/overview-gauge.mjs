/** Accessible, proportionally exact semicircular KPI gauge geometry.
 * One indicator per card. Values are sourced from Configuration Report metrics.
 */
const clamp = value => Math.max(0, Math.min(100, Number.isFinite(Number(value)) ? Number(value) : 0));
const polar = angle => ({x:100+77*Math.cos(angle*Math.PI/180),y:102+77*Math.sin(angle*Math.PI/180)});
const pathBetween = (start,end) => {
  if(end <= start) return null;
  const a=polar(start),b=polar(end);
  return `M ${a.x.toFixed(3)} ${a.y.toFixed(3)} A 77 77 0 0 1 ${b.x.toFixed(3)} ${b.y.toFixed(3)}`;
};
export const gaugeGeometry = (percent, steps=32) => {
  const progress=clamp(percent);
  const fillAngle=180+progress*1.8;
  const step=180/steps;
  const gap=Math.min(.9,step*.18);
  const segments=Array.from({length:steps},(_,index)=>{
    const start=180+index*step+gap;
    const end=180+(index+1)*step-gap;
    return {index,track:pathBetween(start,end),active:pathBetween(start,Math.min(end,fillAngle))};
  });
  return {percent:progress,segments,marker:progress>0?polar(Math.min(360-gap,fillAngle)):null};
};

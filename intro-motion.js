// Confirmed sequence: broadside impact, fall onto the road, then wheels over it.
export function sampleIntroMotion(progress) {
  const p=Math.max(0,Math.min(1,progress));
  const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  const fall=smooth(.43,.58,p);
  const crush=smooth(.64,.74,p);
  // Slow down at contact so the bike reaches the asphalt before the wheel climbs.
  const tractorX=p<.42 ? -3.3+(p/.42)*3.96 : p<.58 ? .66+((p-.42)/.16)*.18 : .84+((p-.58)/.42)*8.76;
  const bikeX=1.6;
  const bump=x=>.29*Math.exp(-Math.pow((x-(bikeX+.65))/.66,4));
  const frontLift=bump(tractorX+.46),rearLift=bump(tractorX-1.72);
  const tractorPitch=Math.atan2(frontLift-rearLift,2.18);
  return {
    tractorX, tractorY:rearLift+1.72*Math.sin(tractorPitch)+.65*(1-Math.cos(tractorPitch)),
    tractorPitch,
    bikeX,bikeY:.02,bikeZ:.40,bikeRoll:fall*Math.PI/2,bikeYaw:Math.PI/2,
    bikeScaleY:1-crush*.12,bikeScaleX:1,fall,crush,
    phase:p<.43?'approach':p<.58?'fall':p<.8?'run-over':'exit'
  };
}

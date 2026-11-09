import * as THREE from './assets/three.module.js';

// 2D convex hull of the mesh's Y/Z projection. It gives exact vertex contact
// for a roll about the bike's longitudinal axis, without scanning the mesh per frame.
export function createRollSupport(object) {
  object.updateMatrixWorld(true);
  const points=[],v=new THREE.Vector3();
  object.traverse(part=>{
    if(!part.isMesh)return;
    const positions=part.geometry.attributes.position;
    for(let i=0;i<positions.count;i++){
      v.fromBufferAttribute(positions,i).applyMatrix4(part.matrixWorld);
      points.push([v.y,v.z]);
    }
  });
  points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const unique=points.filter((p,i)=>!i||p[0]!==points[i-1][0]||p[1]!==points[i-1][1]);
  const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const lower=[],upper=[];
  for(const p of unique){while(lower.length>=2&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
  for(let i=unique.length-1;i>=0;i--){const p=unique[i];while(upper.length>=2&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
  const hull=lower.slice(0,-1).concat(upper.slice(0,-1));
  return roll=>{
    const c=Math.cos(roll),s=Math.sin(roll);
    let min=Infinity;
    for(const [y,z] of hull)min=Math.min(min,y*c-z*s);
    return Number.isFinite(min)?min:0;
  };
}

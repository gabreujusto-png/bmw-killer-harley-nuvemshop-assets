import * as THREE from './assets/three.module.js';
import { GLTFLoader } from './assets/GLTFLoader.js';

export async function loadModel(url, length) {
  const gltf=await new GLTFLoader().loadAsync(url);
  const root=gltf.scene;
  root.updateMatrixWorld(true);
  let bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());
  // The source image shows the vehicle's side. Normalize its longest horizontal axis.
  if(size.z>size.x){root.rotation.y=-Math.PI/2;root.updateMatrixWorld(true);bounds.setFromObject(root);size=bounds.getSize(new THREE.Vector3());}
  const s=length/Math.max(size.x,size.z);root.scale.multiplyScalar(s);root.updateMatrixWorld(true);bounds.setFromObject(root);
  const center=bounds.getCenter(new THREE.Vector3());root.position.x-=center.x;root.position.z-=center.z;root.position.y-=bounds.min.y;
  const wrapper=new THREE.Group();wrapper.add(root);wrapper.updateMatrixWorld(true);
  wrapper.traverse(obj=>{if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true;const mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(m=>{m.envMapIntensity=.85;});}});
  return wrapper;
}

// Split only the wheel regions of the generated, single-mesh tractor. UVs/normals
// are preserved; each wheel gets its own axle pivot for genuine rotation.
export function articulateTractor(wrapper) {
  wrapper.updateMatrixWorld(true);
  const wheels=[{x:-1.72,y:.65,r:.70,z:.62},{x:.46,y:.43,r:.455,z:.54},{x:-1.72,y:.65,r:.70,z:-.62},{x:.46,y:.43,r:.455,z:-.54}];
  const output=new THREE.Group(),pivots=wheels.map(w=>{const g=new THREE.Group();g.position.set(w.x,w.y,w.z);g.userData.radius=w.r;output.add(g);return g;});
  const meshes=[];wrapper.traverse(o=>{if(o.isMesh)meshes.push(o);});
  for(const source of meshes){
    let geo=source.geometry.clone();geo.applyMatrix4(source.matrixWorld);if(geo.index)geo=geo.toNonIndexed();
    const pos=geo.attributes.position, normal=geo.attributes.normal,uv=geo.attributes.uv;
    const buckets=Array.from({length:5},()=>({p:[],n:[],uv:[]}));
    for(let i=0;i<pos.count;i+=3){
      const cx=(pos.getX(i)+pos.getX(i+1)+pos.getX(i+2))/3,cy=(pos.getY(i)+pos.getY(i+1)+pos.getY(i+2))/3,cz=(pos.getZ(i)+pos.getZ(i+1)+pos.getZ(i+2))/3;
      const group=wheels.findIndex(w=>Math.hypot(cx-w.x,cy-w.y)<w.r && Math.sign(cz)===Math.sign(w.z)&&Math.abs(cz)>(w.r>.6?.56:.40));
      const b=buckets[group+1],pivot=group>=0?wheels[group]:{x:0,y:0,z:0};
      for(let j=i;j<i+3;j++){b.p.push(pos.getX(j)-pivot.x,pos.getY(j)-pivot.y,pos.getZ(j)-pivot.z);if(normal)b.n.push(normal.getX(j),normal.getY(j),normal.getZ(j));if(uv)b.uv.push(uv.getX(j),uv.getY(j));}
    }
    buckets.forEach((b,index)=>{if(!b.p.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));if(b.n.length)g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));if(b.uv.length)g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));const m=new THREE.Mesh(g,source.material);m.castShadow=true;m.receiveShadow=true;(index?pivots[index-1]:output).add(m);});
    geo.dispose();
  }
  output.userData.wheels=pivots;return output;
}

export function studioEnvironment(renderer) {
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x202026);
  function panel(size,pos,color){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial({color}));m.position.set(...pos);scene.add(m);}
  panel([8,5,.1],[0,4,6],0xffffff);panel([1.5,8,.1],[-5,3,-4],0xffb477);panel([12,.1,8],[0,7,0],0xffffff);panel([1,5,.1],[5,3,-2],0x97b7e1);
  const pmrem=new THREE.PMREMGenerator(renderer);const target=pmrem.fromScene(scene,.05);pmrem.dispose();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});return target.texture;
}

import * as THREE from './assets/three.module.js';

// Replace the warped, fused AI handlebar with clean, symmetric hard-surface parts.
// Coordinates use a 3.8-unit bike. The supplied GLB remains unchanged on disk.
export function refineHarley(source, length) {
  source.updateMatrixWorld(true);
  const result = new THREE.Group();
  const scale = length / 3.8;
  const cutHeight = 1.775 * scale;
  source.traverse(part => {
    if (!part.isMesh) return;
    const transformed = part.geometry.clone().applyMatrix4(part.matrixWorld);
    const geometry = transformed.index ? transformed.toNonIndexed() : transformed;
    if (geometry !== transformed) transformed.dispose();
    const attributes = geometry.attributes;
    const buffers = Object.fromEntries(Object.keys(attributes).map(key => [key, []]));
    for (let i = 0; i < attributes.position.count; i += 3) {
      const y = (attributes.position.getY(i) + attributes.position.getY(i+1) + attributes.position.getY(i+2)) / 3;
      if (y > cutHeight) continue;
      for (const [key, attribute] of Object.entries(attributes)) {
        for (let n = i; n < i+3; n++) {
          for (let c = 0; c < attribute.itemSize; c++) buffers[key].push(attribute.array[n*attribute.itemSize+c]);
        }
      }
    }
    const body = new THREE.BufferGeometry();
    for (const [key, values] of Object.entries(buffers)) body.setAttribute(key, new THREE.Float32BufferAttribute(values, attributes[key].itemSize));
    body.computeBoundingBox(); body.computeBoundingSphere();
    const mesh = new THREE.Mesh(body, part.material);
    mesh.castShadow = true; mesh.receiveShadow = true;
    result.add(mesh); geometry.dispose();
  });

  const cockpit = new THREE.Group(); cockpit.name = 'Refined handlebar'; cockpit.scale.setScalar(scale); result.add(cockpit);
  const chrome = new THREE.MeshStandardMaterial({color:0xdce3e7,metalness:1,roughness:.2,envMapIntensity:1.1});
  const rubber = new THREE.MeshStandardMaterial({color:0x101012,roughness:.76});
  const hardware = new THREE.MeshStandardMaterial({color:0x18191b,metalness:.65,roughness:.3});
  const glass = new THREE.MeshStandardMaterial({color:0x71828b,metalness:.95,roughness:.08});
  const V = point => new THREE.Vector3(...point);
  function add(geometry, material, position) {const m=new THREE.Mesh(geometry,material);m.position.copy(V(position));m.castShadow=true;cockpit.add(m);return m;}
  function rod(a,b,r,material) {const av=V(a),bv=V(b),delta=bv.clone().sub(av);const m=add(new THREE.CylinderGeometry(r,r,delta.length(),20),material,av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
  function tube(points,r,material) {const path=new THREE.CatmullRomCurve3(points.map(V),false,'centripetal');return add(new THREE.TubeGeometry(path,64,r,12,false),material,[0,0,0]);}

  // Real curved ape-hanger silhouette, with a moderate rise and underslung mirrors.
  rod([.67,1.71,-.11],[.65,1.78,-.11],.035,chrome);
  rod([.67,1.71,.11],[.65,1.78,.11],.035,chrome);
  rod([.65,1.78,-.17],[.65,1.78,.17],.028,chrome);
  for (const side of [-1,1]) {
    tube([[.65,1.78,side*.13],[.63,1.78,side*.22],[.58,1.85,side*.28],[.47,2.04,side*.36],[.42,2.08,side*.43],[.33,2.07,side*.49]],.024,chrome);
    const gripA=[.34,2.07,side*.48],gripB=[.13,2.045,side*.58];
    rod(gripA,gripB,.034,rubber);
    rod([.125,2.044,side*.582],[.105,2.042,side*.59],.037,chrome);
    const control=add(new THREE.BoxGeometry(.08,.065,.09),hardware,[.34,2.07,side*.47]);control.rotation.y=side*.35;
    // Brake/clutch levers, cables and small round mirrors below the grips.
    tube([[.36,2.055,side*.49],[.32,2.025,side*.58],[.18,2.005,side*.65]],.011,chrome);
    tube([[.35,2.045,side*.46],[.42,1.94,side*.32],[.72,1.74,side*.14],[.82,1.43,side*.12]],.008,rubber);
    tube([[.32,2.04,side*.48],[.32,1.94,side*.55],[.24,1.9,side*.6]],.012,chrome);
    const mirror=add(new THREE.CylinderGeometry(.07,.07,.024,32),chrome,[.24,1.89,side*.60]);mirror.rotation.z=Math.PI/2;
    const face=add(new THREE.CircleGeometry(.062,32),glass,[.226,1.89,side*.60]);face.rotation.y=-Math.PI/2;
  }
  result.userData.refinement='Symmetric handlebar, controls, cables and underslung mirrors';
  return result;
}

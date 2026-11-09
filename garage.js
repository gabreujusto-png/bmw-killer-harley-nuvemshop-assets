import * as THREE from './assets/three.module.js';
import { OrbitControls } from './assets/OrbitControls.js';
import { loadModel, studioEnvironment } from './models.js';
import { refineHarley } from './harley-refinement.js';

const section=document.querySelector('.garage');
const stage=section.querySelector('.garage__stage'), host=section.querySelector('.garage__canvas');
const status=section.querySelector('.garage__loading');
let renderer,scene,camera,controls,model,visible=false,dirty=true,loading=false,paused=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;dirty=true;if(visible)loadGarage();},{rootMargin:'650px'});observer.observe(stage);
async function loadGarage(){
  if(loading||host.dataset.loaded==='true')return;loading=true;status.textContent='PREPARANDO A VISUALIZAÇÃO 3D…';
  try {
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(max-width: 700px)').matches?1:1.6));renderer.setClearColor(0x050505,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    scene=new THREE.Scene();scene.environment=studioEnvironment(renderer);
    scene.add(new THREE.HemisphereLight(0xffffff,0x231008,2.5));
    const key=new THREE.DirectionalLight(0xffe5d2,3);key.position.set(3,5,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-3;key.shadow.camera.right=3;key.shadow.camera.top=3;key.shadow.camera.bottom=-3;key.shadow.normalBias=.025;scene.add(key);
    const rim=new THREE.DirectionalLight(0xff6a16,2);rim.position.set(-3,3,-3);scene.add(rim);
    camera=new THREE.PerspectiveCamera(35,1,.05,100);
    model=refineHarley(await loadModel('https://cdn.jsdelivr.net/gh/gabreujusto-png/bmw-killer-harley-nuvemshop-assets@native-v6/assets/harley-generated.glb',3.8),3.8);scene.add(model);
    const bounds=new THREE.Box3().setFromObject(model);const size=bounds.getSize(new THREE.Vector3());
    // Low showroom plinth. Its top sits directly beneath the tires.
    const plinth=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.22,.12,128),new THREE.MeshStandardMaterial({color:0x171719,metalness:.5,roughness:.48}));
    plinth.position.y=-.065;plinth.receiveShadow=true;scene.add(plinth);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(2.205,.009,8,128),new THREE.MeshBasicMaterial({color:0xff5a00}));
    ring.rotation.x=Math.PI/2;ring.position.y=-.055;scene.add(ring);
    controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,size.y*.49,0);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=2.8;controls.maxDistance=20;controls.enablePan=false;controls.autoRotate=!reduced;controls.autoRotateSpeed=.65;
    controls.mouseButtons.RIGHT=THREE.MOUSE.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_ROTATE;
    controls.addEventListener('change',()=>dirty=true);
    host.append(renderer.domElement);
    function reset(){controls.target.set(0,size.y*.49,0);const radius=Math.max(7.4,2.45/(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect));const polar=1.34;controls.minPolarAngle=polar;controls.maxPolarAngle=polar;camera.position.copy(controls.target).add(new THREE.Vector3().setFromSphericalCoords(Math.min(radius,20),polar,.48));controls.update();dirty=true;}
    function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true;}
    new ResizeObserver(resize).observe(host);resize();reset();
    stage.classList.add('is-ready');stage.querySelector('.garage__poster').hidden=true;stage.querySelector('.garage__controls').hidden=false;stage.querySelector('.garage__hint').hidden=false;status.textContent='Modelo carregado';
    host.dataset.loaded='true';
    window.dispatchEvent(new CustomEvent('harley:model', { detail: { status: 'loaded' } }));
    const rotateButton=section.querySelector('[data-model-action="rotate"]');
    function syncRotation(){rotateButton.setAttribute('aria-pressed',String(controls.autoRotate));rotateButton.textContent=controls.autoRotate?'PAUSAR GIRO':'GIRO AUTOMÁTICO';}
    syncRotation();
    controls.addEventListener('start',()=>{controls.autoRotate=false;syncRotation();dirty=true;});
    function zoom(factor){camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();dirty=true;}
    section.querySelectorAll('[data-model-action]').forEach(b=>b.addEventListener('click',async()=>{
      const action=b.dataset.modelAction;
      if(action==='rotate'){controls.autoRotate=!controls.autoRotate;syncRotation();dirty=true;}
      if(action==='in')zoom(.82);if(action==='out')zoom(1.2);if(action==='reset'){controls.autoRotate=false;rotateButton.setAttribute('aria-pressed','false');rotateButton.textContent='GIRO AUTOMÁTICO';reset();}
      if(action==='fullscreen'){try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen();}catch{stage.classList.toggle('is-expanded');b.setAttribute('aria-label',stage.classList.contains('is-expanded')?'Reduzir visualização 3D':'Expandir visualização 3D');resize();}}
    }));
    host.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))return;e.preventDefault();if(e.key==='+'||e.key==='ArrowUp')zoom(.9);if(e.key==='-'||e.key==='ArrowDown')zoom(1.1);if(e.key==='ArrowLeft'||e.key==='ArrowRight'){const v=camera.position.clone().sub(controls.target);v.applyAxisAngle(new THREE.Vector3(0,1,0),e.key==='ArrowLeft'?-.15:.15);camera.position.copy(controls.target).add(v);controls.update();dirty=true;}});
    let last=0;
    function frame(now){requestAnimationFrame(frame);if(!visible||document.hidden||now-last<33)return;const delta=Math.min((now-last)/1000,.1);last=now;if(controls.autoRotate&&!paused&&!reduced)dirty=true;const rotating=controls.autoRotate;controls.autoRotate=rotating&&!paused&&!reduced;const changed=controls.update(delta);controls.autoRotate=rotating;if(dirty||changed){renderer.render(scene,camera);dirty=false;}}
    requestAnimationFrame(frame);
  }catch(error){status.textContent='3D indisponível neste dispositivo. Veja as fotos reais abaixo.';renderer?.dispose();loading=false;window.dispatchEvent(new CustomEvent('harley:model', { detail: { status: 'failed' } }));console.warn('Falha ao abrir modelo 3D:',error.message);}
}
window.addEventListener('effects-toggle',e=>{paused=e.detail.paused;dirty=true;});

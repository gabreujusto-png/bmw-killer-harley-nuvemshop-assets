/* Original WebGL shaders. Visual references: 21st.dev golden mesh, halftone and plasma.
   No gated source code is used. Only visible canvases render, capped at 30fps. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let paused = reduced;
  const pauseButton = document.querySelector('.motion-toggle');
  pauseButton.addEventListener('click', () => {
    paused = !paused;
    document.body.classList.toggle('effects-paused', paused);
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.innerHTML = paused ? 'RETOMAR EFEITOS <span>▷</span>' : 'PAUSAR EFEITOS <span>Ⅱ</span>';
    window.dispatchEvent(new CustomEvent('effects-toggle', { detail: { paused } }));
  });
  if (reduced) document.body.classList.add('effects-paused');
  const vertex = `attribute vec2 a_position; void main(){ gl_Position=vec4(a_position,0.,1.); }`;
  const fragment = `precision mediump float;
    uniform vec2 u_resolution; uniform float u_time; uniform vec2 u_pointer; uniform float u_mode;
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
    float fbm(vec2 p){float n=0.;float a=.5;for(int i=0;i<4;i++){n+=a*noise(p);p=mat2(.8,.6,-.6,.8)*p*2.12;a*=.5;}return n;}
    void main(){
      vec2 uv=gl_FragCoord.xy/u_resolution; vec2 p=(uv-.5)*vec2(u_resolution.x/u_resolution.y,1.);
      float t=u_time*.13; p+=(u_pointer-.5)*.08;
      vec2 q=vec2(fbm(p*2.1+t*.35),fbm(p*2.2+vec2(4.7,2.1)-t*.3));
      float f=fbm(p*2.8+q*3.+vec2(t*.3,-t*.2));
      vec3 orange=vec3(1.,.20,.018); vec3 gold=vec3(1.,.53,.13); vec3 col=vec3(.008);
      if(u_mode<.5){
        float glow=pow(max(0.,1.-abs(f-.54)*3.5),4.);
        float wave=sin(p.x*3.+p.y*1.8+t+f*4.)*.5+.5;
        col=mix(vec3(.012,.004,.001),mix(orange,gold,wave),glow*.42);
        col*=smoothstep(.0,.85,uv.x+.2); 
      }else if(u_mode<1.5){
        float flow=sin(p.x*4.+sin(p.y*5.+t)+f*7.-t)*.5+.5;
        float grid=8.;vec2 cell=mod(gl_FragCoord.xy,grid)-grid*.5;
        float radius=1.0+flow*2.3;float dotMask=1.-smoothstep(radius-.7,radius+.5,length(cell));
        col=mix(vec3(.008),mix(orange,gold,flow*.45),dotMask*(.07+pow(flow,2.)*.7));
      }else{
        float field=sin(f*13.+t*1.5+p.x*1.5);
        float band=exp(-abs(field)*8.);float halo=exp(-abs(field)*2.);
        col=orange*halo*.18+mix(orange,gold,band)*band*.6;
        col*=.6+.4*sin(p.y*3.+t);
      }
      col*=1.-.45*length(uv-.5);col+=(hash(gl_FragCoord.xy)-.5)*.018;
      gl_FragColor=vec4(col,1.);
    }`;
  const effects = [];
  function shader(canvas) {
    const gl = canvas.getContext('webgl', {alpha:false, antialias:false, powerPreference:'low-power'});
    if (!gl) return;
    function compile(type, source) {
      const s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s);
      if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) { gl.deleteShader(s); throw new Error('Shader unavailable'); } return s;
    }
    try {
      const program=gl.createProgram(); const vs=compile(gl.VERTEX_SHADER,vertex), fs=compile(gl.FRAGMENT_SHADER,fragment);
      gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Shader unavailable');
      gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const attr=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
      const uniforms=Object.fromEntries(['resolution','time','pointer','mode'].map(k=>[k,gl.getUniformLocation(program,`u_${k}`)]));
      const mode={gold:0,halftone:1,plasma:2}[canvas.dataset.shader];
      const fx={canvas,visible:false,render(time){
        const ratio=Math.min(devicePixelRatio,1.25);const w=Math.round(canvas.clientWidth*ratio*.8), h=Math.round(canvas.clientHeight*ratio*.8);
        if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
        gl.useProgram(program);gl.uniform2f(uniforms.resolution,w,h);gl.uniform1f(uniforms.time,time);gl.uniform2f(uniforms.pointer,pointer.x,pointer.y);gl.uniform1f(uniforms.mode,mode);gl.drawArrays(gl.TRIANGLES,0,6);
      }};
      effects.push(fx);
      canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fx.visible=false;canvas.style.opacity='0';});
    } catch { canvas.style.display='none'; }
  }
  const pointer={x:.5,y:.5};
  window.addEventListener('pointermove',e=>{pointer.x=e.clientX/innerWidth;pointer.y=1-e.clientY/innerHeight;},{passive:true});
  document.querySelectorAll('[data-shader]').forEach(shader);
  const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
    const fx=effects.find(f=>f.canvas===entry.target);if(fx){fx.visible=entry.isIntersecting;if(fx.visible)fx.render(time);}
    if(entry.target===stream) streamVisible=entry.isIntersecting;
  }),{rootMargin:'100px'});
  let time=0,last=0,streamVisible=false;
  const stream=document.querySelector('.image-stream');
  const rails=document.querySelector('.image-stream__rails');
  const files=['bike-side','tank','iron-harvest','seat','scars','bike-front'];
  const frames=files.map((file,index)=>{
    const frame=document.createElement('div');frame.className='stream-frame';
    const img=document.createElement('img');img.src=`https://cdn.jsdelivr.net/gh/gabreujusto-png/bmw-killer-harley-nuvemshop-assets@native-v4/assets/${file}.webp`;img.alt='';img.loading='lazy';img.decoding='async';img.draggable=false;frame.append(img);rails.append(frame);
    return {frame,side:index%2?-1:1,offset:Math.floor(index/2)/3};
  });
  function drawStream(t){frames.forEach(({frame,side,offset})=>{
    const p=(t*.038+offset)%1; const z=-2300+p*2830;
    const x=side*(410+Math.sin(t*.12)*18);const y=Math.sin(offset*6.28)*100;
    frame.style.transform=`translate3d(${x}px,${y}px,${z}px) rotateY(${side*(-25+p*22)}deg) rotateZ(${side*(2+p*4)}deg)`;
    frame.style.opacity=String(Math.min(1,p*6,(1-p)*7)*.85);
  });}
  effects.forEach(f=>io.observe(f.canvas));io.observe(stream);drawStream(4);
  function animate(now){requestAnimationFrame(animate);if(now-last<33)return;const delta=Math.min(.1,(now-last)/1000);last=now;if(paused||document.hidden)return;time+=delta;effects.forEach(f=>{if(f.visible)f.render(time);});if(streamVisible)drawStream(time);}
  requestAnimationFrame(animate);

  // Horizontal photography rail: native touch + mouse drag + arrow buttons.
  const viewport=document.querySelector('.details__viewport');
  const previous=document.querySelector('.gallery-prev'), next=document.querySelector('.gallery-next');
  function updateArrows(){previous.disabled=viewport.scrollLeft<=2;next.disabled=viewport.scrollLeft>=viewport.scrollWidth-viewport.clientWidth-3;}
  function galleryStep(direction){viewport.scrollBy({left:direction*(viewport.querySelector('.detail-card').clientWidth+22),behavior:reduced?'auto':'smooth'});}
  previous.addEventListener('click',()=>galleryStep(-1));next.addEventListener('click',()=>galleryStep(1));
  viewport.addEventListener('scroll',updateArrows,{passive:true});window.addEventListener('resize',updateArrows);updateArrows();
  let drag=null,suppressClick=false;
  viewport.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;drag={x:e.clientX,scroll:viewport.scrollLeft,id:e.pointerId};suppressClick=false;});
  viewport.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>5){suppressClick=true;viewport.classList.add('is-dragging');viewport.setPointerCapture(e.pointerId);}if(suppressClick)viewport.scrollLeft=drag.scroll-dx;});
  const stopDrag=()=>{drag=null;viewport.classList.remove('is-dragging');};
  viewport.addEventListener('pointerup',stopDrag);viewport.addEventListener('pointercancel',stopDrag);
  viewport.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;}},true);

  // Accessible fullscreen photograph inspection; deliberately not called 3D.
  const dialog=document.querySelector('.photo-viewer'), stage=dialog.querySelector('.photo-viewer__stage'), photo=stage.querySelector('img');
  const caption=dialog.querySelector('.photo-viewer__caption'), reset=dialog.querySelector('[data-viewer="reset"]');
  const photoButtons=Array.from(document.querySelectorAll('[data-photo]'));
  let active=0,zoom=1,pan={x:0,y:0},lastFocus=null;const touches=new Map();let pinch=null;
  function paint(){const xLimit=stage.clientWidth*(zoom-1)/2,yLimit=stage.clientHeight*(zoom-1)/2;pan.x=Math.max(-xLimit,Math.min(xLimit,pan.x));pan.y=Math.max(-yLimit,Math.min(yLimit,pan.y));photo.style.transform=`translate(${pan.x}px,${pan.y}px) scale(${zoom})`;reset.textContent=`${Math.round(zoom*100)}%`;stage.classList.toggle('is-zoomed',zoom>1);dialog.querySelector('[data-viewer="out"]').disabled=zoom<=1;dialog.querySelector('[data-viewer="in"]').disabled=zoom>=3;}
  function setZoom(value){zoom=Math.max(1,Math.min(3,value));if(zoom===1)pan={x:0,y:0};paint();}
  function showPhoto(index){active=(index+photoButtons.length)%photoButtons.length;const source=photoButtons[active];photo.src=source.dataset.photo;photo.alt=source.dataset.caption;caption.textContent=source.dataset.caption;zoom=1;pan={x:0,y:0};paint();}
  function close(){dialog.close();}
  photoButtons.forEach((button,index)=>button.addEventListener('click',()=>{lastFocus=button;showPhoto(index);dialog.showModal();document.body.classList.add('has-dialog');dialog.querySelector('[data-viewer="close"]').focus();}));
  dialog.addEventListener('close',()=>{document.body.classList.remove('has-dialog');touches.clear();lastFocus?.focus({preventScroll:true});});
  dialog.addEventListener('click',e=>{const action=e.target.closest('[data-viewer]')?.dataset.viewer;if(action==='close')close();if(action==='in')setZoom(zoom+.5);if(action==='out')setZoom(zoom-.5);if(action==='reset')setZoom(1);if(action==='next')showPhoto(active+1);if(action==='prev')showPhoto(active-1);});
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();showPhoto(active+1);}if(e.key==='ArrowLeft'){e.preventDefault();showPhoto(active-1);}if(e.key==='+'||e.key==='='){e.preventDefault();setZoom(zoom+.5);}if(e.key==='-'){e.preventDefault();setZoom(zoom-.5);}});
  stage.addEventListener('wheel',e=>{e.preventDefault();setZoom(zoom-e.deltaY*.002);},{passive:false});
  stage.addEventListener('dblclick',()=>setZoom(zoom===1?2:1));
  stage.addEventListener('pointerdown',e=>{touches.set(e.pointerId,{x:e.clientX,y:e.clientY});stage.setPointerCapture(e.pointerId);stage.classList.add('is-dragging');if(touches.size===2){const pts=[...touches.values()];pinch={distance:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),zoom};}});
  stage.addEventListener('pointermove',e=>{const old=touches.get(e.pointerId);if(!old)return;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===2&&pinch){const pts=[...touches.values()];setZoom(pinch.zoom*Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)/pinch.distance);}else if(zoom>1){pan.x+=e.clientX-old.x;pan.y+=e.clientY-old.y;paint();}});
  function release(e){touches.delete(e.pointerId);pinch=null;if(!touches.size)stage.classList.remove('is-dragging');}
  stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);
  document.querySelector('.replay-intro')?.addEventListener('click',()=>location.reload());
})();

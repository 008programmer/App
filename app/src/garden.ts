import * as THREE from 'three';

export function createGarden(canvas: HTMLCanvasElement, paint: (id: string) => void) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor('#c5e9e3');
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-7, 7, 5, -5, .1, 100);
  camera.position.set(0, 0, 20);
  scene.add(new THREE.HemisphereLight('#fff8df', '#7da98c', 2));
  const light = new THREE.DirectionalLight('#fff3d7', 3);
  light.position.set(-4, 8, 12); light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 });
  light.shadow.normalBias = .04; scene.add(light);
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  function material(colour: string) {
    if (!materials.has(colour)) materials.set(colour, new THREE.MeshStandardMaterial({ color: colour, roughness: .86 }));
    return materials.get(colour)!;
  }
  function ball(parent: THREE.Object3D, colour: string, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) {
    const mesh = new THREE.Mesh(sphere, material(colour)); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
    mesh.castShadow = false; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function face(parent: THREE.Object3D, y = 0, z = .66, scale = 1) {
    for (const side of [-1, 1]) {
      ball(parent, '#594733', side * .21 * scale, y + .1 * scale, z, .055 * scale, .085 * scale, .035);
      ball(parent, '#eea075', side * .34 * scale, y - .07 * scale, z - .01, .095 * scale, .065 * scale, .035);
    }
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.15 * scale, y - .07 * scale, z + .025), new THREE.Vector3(0, y - .33 * scale, z + .04), new THREE.Vector3(.15 * scale, y - .07 * scale, z + .025));
    parent.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, .027 * scale, 6, false), material('#594733')));
  }
  // A little stage made from layered hills, cloud puffs and wooden fence posts.
  ball(scene, '#b4d6a6', -5, -2.8, -4, 15, 3, .8);
  ball(scene, '#a1c897', 5, -3, -3, 15, 3.2, .8);
  for (const [x, y, s] of [[-4, 3, 1], [2, 3.6, .7]]) {
    for (const [dx, dy, size] of [[-.6, 0, .65], [0, .25, .85], [.65, 0, .6]]) ball(scene, '#fff9ec', x! + dx! * s!, y! + dy! * s!, -2, size! * s!, size! * s! * .7, .3);
  }
  for (let i = -8; i <= 8; i++) ball(scene, '#dfba81', i * .88, -2.65, -1.8, .22, .9, .16);
  ball(scene, '#e9c991', 0, -2.7, -1.9, 9, .12, .13);
  ball(scene, '#83b979', 0, -4.7, -1, 12, 2.1, 1);
  ball(scene, '#9bca83', -4, -4.6, 0, 6, 1.7, .8);
  const paintMeshes: Record<string, THREE.Mesh[]> = {};
  const flowers: THREE.Group[] = [];
  const objects: THREE.Object3D[] = [];
  for (const [id, x, y, scale] of [['flower1', -3.5, -.7, 1.05], ['flower2', 0, .1, 1.2], ['flower3', 3.4, -.9, 1]] as const) {
    const group = new THREE.Group(); group.position.set(x, y, 1); group.scale.setScalar(scale); group.userData.target = id; scene.add(group); flowers.push(group); objects.push(group);
    ball(group, '#588d47', 0, -1.65, -.25, .13, 1.6, .14);
    for (const side of [-1, 1]) { const leaf = ball(group, '#6ea54e', side * .52, -1.8, -.1, .65, .25, .2); leaf.rotation.z = side * .55; }
    paintMeshes[id] = [];
    for (let i = 0; i < 6; i++) { const angle = i * Math.PI / 3; const petal = ball(group, '#ffffff', Math.sin(angle) * .87, Math.cos(angle) * .87, 0, .56, .79, .39); petal.rotation.z = -angle; petal.castShadow = true; paintMeshes[id].push(petal); }
    ball(group, '#ffda65', 0, 0, .38, .61, .61, .33); face(group);
  }
  const butterfly = new THREE.Group(); butterfly.position.set(-2, 2.55, 2); butterfly.rotation.z = -.23; scene.add(butterfly); butterfly.userData.target = 'butterfly'; objects.push(butterfly); paintMeshes.butterfly = [];
  const wings: THREE.Mesh[] = [];
  for (const side of [-1, 1]) for (const upper of [true, false]) {
    const wing = ball(butterfly, '#a283cc', side * .44, upper ? .2 : -.35, 0, upper ? .45 : .32, upper ? .62 : .37, .15); wing.rotation.z = side * -.35; wings.push(wing); paintMeshes.butterfly.push(wing);
    ball(butterfly, '#e0c7ea', side * .48, upper ? .22 : -.35, .15, .17, .22, .04);
  }
  ball(butterfly, '#bfa0d3', 0, -.2, .2, .16, .52, .16); ball(butterfly, '#f7d3b7', 0, .35, .23, .26); face(butterfly, .35, .48, .4);
  const sun = new THREE.Group(); sun.position.set(4.6, 2.9, 1); scene.add(sun); sun.userData.target = 'sunshine'; objects.push(sun);
  for (let i = 0; i < 10; i++) { const angle = i * Math.PI / 5; const ray = ball(sun, '#ffcf55', Math.sin(angle) * 1.03, Math.cos(angle) * 1.03, 0, .13, .28, .12); ray.rotation.z = -angle; }
  ball(sun, '#ffda65', 0, 0, .1, .75, .75, .3); face(sun, 0, .42, 1.1);
  for (let i = 0; i < 23; i++) {
    const x = -8 + i * .72, y = -3.75 + Math.sin(i * 2.7) * .3;
    for (const side of [-1, 0, 1]) { const leaf = ball(scene, i % 2 ? '#669f54' : '#b6d987', x + side * .13, y, 1.4, .13, .4, .12); leaf.rotation.z = side * -.4; }
    if (i % 4 === 0) { for (let j = 0; j < 5; j++) ball(scene, '#fff8e7', x + Math.sin(j * 1.256) * .17, y + .25 + Math.cos(j * 1.256) * .17, 1.7, .12, .13, .08); ball(scene, '#f3c653', x, y + .25, 1.8, .1); }
  }
  let frame = 0, until = 0, visible = true; let pulseId = ''; let pulseStart = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function render() {
    frame = 0; if (document.hidden || !visible) return;
    const now = performance.now(), moving = now < until && !reduced.matches;
    flowers.forEach((flower, i) => { flower.rotation.z = moving ? Math.sin(now / 240 + i) * .045 : 0; });
    butterfly.position.y = 2.55 + (moving ? Math.sin(now / 190) * .18 : 0);
    wings.forEach((wing, i) => { wing.scale.z = moving ? .15 + Math.abs(Math.sin(now / 130 + i)) * .2 : .15; });
    const pulsing = now - pulseStart < 320 && !reduced.matches;
    flowers.forEach(flower => { const base = flower.userData.baseScale ?? 1; flower.scale.setScalar(base * (pulsing && flower.userData.target === pulseId ? 1 + Math.sin((now-pulseStart)/320*Math.PI)*.055 : 1)); });
    butterfly.scale.setScalar(pulsing && pulseId === 'butterfly' ? 1 + Math.sin((now-pulseStart)/320*Math.PI)*.08 : 1);
    renderer.render(scene, camera); if (moving || pulsing) frame = requestAnimationFrame(render);
  }
  function request() { if (!frame && !document.hidden && visible) frame = requestAnimationFrame(render); }
  function resize() { const { width, height } = canvas.getBoundingClientRect(); if (!width || !height) return; renderer.setSize(width, height, false); const ratio = width / height; const portrait = ratio < 1; const halfWidth = portrait ? 4.8 : Math.max(6.5, 4.6 * ratio);
    flowers.forEach((flower,i)=>{ flower.position.x = (portrait ? [-2.6,0,2.55] : [-3.5,0,3.4])[i]!; flower.userData.baseScale = (portrait ? [.8,.98,.78] : [1.05,1.2,1])[i]!; flower.scale.setScalar(flower.userData.baseScale); });
    butterfly.position.x = portrait ? -2 : -4.2; sun.position.x = portrait ? 3.3 : 4.6; sun.scale.setScalar(portrait ? .8 : 1); camera.left = -halfWidth; camera.right = halfWidth; camera.top = halfWidth / ratio; camera.bottom = -halfWidth / ratio; camera.updateProjectionMatrix(); request(); }
  const raycaster = new THREE.Raycaster(); let down: { x: number; y: number; id: number } | null = null;
  canvas.addEventListener('pointerdown', e => { if (down === null) down = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
  canvas.addEventListener('pointercancel', () => { down = null; });
  canvas.addEventListener('pointerup', e => { if (!down || down.id !== e.pointerId) return; const start = down; down = null; if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12) return; const r = canvas.getBoundingClientRect(); raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1, -(e.clientY-r.top)/r.height*2+1), camera); let hit: THREE.Object3D | null = raycaster.intersectObjects(objects, true)[0]?.object ?? null; while (hit && !hit.userData.target) hit = hit.parent; if (hit) paint(hit.userData.target); });
  new ResizeObserver(resize).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else request(); });
  reduced.addEventListener('change', request);
  return {
    recolour(values: Record<string, string>) { for (const [id, colour] of Object.entries(values)) paintMeshes[id]?.forEach(mesh => { mesh.material = material(colour); }); request(); },
    pulse(id: string) { pulseId = id; pulseStart = performance.now(); request(); },
    dance() { until = performance.now() + 3600; request(); },
    show(value: boolean) { visible = value; if (value) resize(); else { cancelAnimationFrame(frame); frame = 0; } }
  };
}


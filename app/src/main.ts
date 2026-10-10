import './styles.css';
import { createGarden } from './garden';
import { validSaved } from './state';
import { openDB, type IDBPDatabase } from 'idb';

type ColourId = 'pink' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';
type TargetId = 'flower1' | 'flower2' | 'flower3' | 'butterfly';
type Stroke = { colour: ColourId; points: [number, number][] };
type SavedGame = { schemaVersion: 1; selectedColour: ColourId; activity: 'garden' | 'draw'; garden: Record<TargetId, ColourId>; strokes: Stroke[] };

const colours: Record<ColourId, { label: string; hex: string }> = { pink: { label: 'Pink', hex: '#f06d8f' }, orange: { label: 'Orange', hex: '#f59755' }, yellow: { label: 'Yellow', hex: '#f3c84b' }, green: { label: 'Green', hex: '#63b878' }, blue: { label: 'Blue', hex: '#599bd6' }, purple: { label: 'Purple', hex: '#9e7ac9' } };
const defaults: SavedGame = { schemaVersion: 1, selectedColour: 'pink', activity: 'garden', garden: { flower1: 'pink', flower2: 'yellow', flower3: 'blue', butterfly: 'purple' }, strokes: [] };
let state: SavedGame = structuredClone(defaults);
let db: IDBPDatabase | null = null;
const undo: { garden: Array<[TargetId, ColourId]>; draw: Stroke[] } = { garden: [], draw: [] };

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<main class="game-shell"><header class="topbar"><div class="brand-mark" aria-hidden="true">✿</div><div><p class="eyebrow">A little world of your own</p><h1>Magic <span>Colour</span> Garden</h1></div><button class="parent-button" id="parentButton" aria-label="Download drawing">↧</button></header><nav class="activity-tabs" aria-label="Activity"><button class="activity active" data-activity="garden">❀ Garden</button><button class="activity" data-activity="draw">✎ Draw</button></nav><section class="stage" id="stage"><div class="scene-label" aria-hidden="true">LET YOUR COLOURS GROW</div><canvas id="gardenCanvas" aria-label="Three dimensional colouring garden"></canvas><canvas id="drawCanvas" aria-label="Blank drawing page" hidden></canvas><div class="fallback" id="fallback" hidden>Your garden is ready to grow. Choose a colour below.</div><button class="sunshine" id="sunshine" aria-label="Make the garden dance">☀ <span>A little sunshine</span></button></section><footer class="toolbox"><div class="toolbox-heading"><span>YOUR LITTLE COLOUR BOX</span><span aria-hidden="true">✦</span></div><section class="palette" aria-label="Six colours" id="palette"></section><div class="toolbox-bottom"><button class="undo" id="undo" disabled>↶ <span>Undo</span></button><div class="status" role="status" aria-live="polite" id="status">Pick a colour. Tap a flower.</div><span class="helper">Made for wondering.</span></div></footer><div class="save-status" id="saveStatus" role="status"></div><div class="update-toast" id="updateToast" hidden><span>A new garden is ready.</span><button id="updateButton">Update</button></div></main>`;

const gardenCanvas = document.querySelector<HTMLCanvasElement>('#gardenCanvas')!; const drawCanvas = document.querySelector<HTMLCanvasElement>('#drawCanvas')!; const drawCtx = drawCanvas.getContext('2d')!; const status = document.querySelector<HTMLDivElement>('#status')!; const undoButton = document.querySelector<HTMLButtonElement>('#undo')!; const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
for (const id of Object.keys(colours) as ColourId[]) { const button = document.createElement('button'); button.className = 'crayon'; button.dataset.colour = id; button.innerHTML = `<span class="crayon-tip" style="--crayon:${colours[id].hex}"><span class="crayon-check">✓</span></span><span>${colours[id].label}</span>`; button.setAttribute('aria-label', `${colours[id].label} crayon`); button.addEventListener('click', () => { state.selectedColour = id; renderControls(); save(); }); document.querySelector('#palette')!.append(button); }
document.querySelectorAll<HTMLButtonElement>('.activity').forEach((button) => button.addEventListener('click', () => { finishStroke(); state.activity = button.dataset.activity as 'garden' | 'draw'; renderControls(); renderMode(); save(); }));
const targetPicker = document.createElement('div'); targetPicker.className = 'target-picker'; targetPicker.setAttribute('aria-label','Garden paint targets'); for (const [id,label] of [['flower1','Flower one'],['flower2','Flower two'],['flower3','Flower three'],['butterfly','Butterfly']] as [TargetId,string][]) { const button=document.createElement('button'); button.type='button'; button.dataset.target=id; button.textContent=label; button.addEventListener('click',()=>paintTarget(id)); targetPicker.append(button); } document.querySelector('#stage')!.append(targetPicker);
undoButton.addEventListener('click', () => { if (state.activity === 'garden') { const previous = undo.garden.pop(); if (previous) { state.garden[previous[0]] = previous[1]; renderGarden(); announce('Undid garden colour'); } } else { undo.draw.pop(); state.strokes = [...undo.draw]; renderDrawing(); announce('Undid drawing'); } renderControls(); save(); });
function renderControls() { document.querySelectorAll<HTMLButtonElement>('.crayon').forEach((button) => { const selected = button.dataset.colour === state.selectedColour; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); }); document.querySelectorAll<HTMLButtonElement>('.activity').forEach((button) => { const selected = button.dataset.activity === state.activity; button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected)); }); undoButton.disabled = state.activity === 'garden' ? undo.garden.length === 0 : undo.draw.length === 0; }
function announce(message: string) { status.textContent = message; }

let garden: ReturnType<typeof createGarden> | null = null;
function initGarden() {
  try { garden = createGarden(gardenCanvas, id => id === 'sunshine' ? animateGarden() : paintTarget(id as TargetId)); renderGarden(); }
  catch { document.querySelector<HTMLElement>('#fallback')!.hidden = false; announce('Use the flower buttons to colour your garden.'); }
}
function renderGarden() {
  garden?.recolour(Object.fromEntries(Object.entries(state.garden).map(([id, colour]) => [id, colours[colour].hex])));
  targetPicker.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.style.setProperty('--target-colour', colours[state.garden[button.dataset.target as TargetId]].hex); });
}
function animateGarden() { garden?.dance(); announce(reducedMotion.matches ? 'A little sunshine for your garden.' : 'The garden is dancing!'); }
document.querySelector('#sunshine')!.addEventListener('click', animateGarden);

function renderMode(){ const isGarden=state.activity==='garden'; gardenCanvas.hidden=!isGarden || !garden; drawCanvas.hidden=isGarden; targetPicker.hidden=!isGarden; document.querySelector<HTMLElement>('#sunshine')!.hidden=!isGarden; document.querySelector<HTMLElement>('.scene-label')!.hidden=!isGarden; document.querySelector<HTMLElement>('#fallback')!.hidden=!isGarden || !!garden; garden?.show(isGarden); announce(isGarden ? 'Pick a colour. Tap a flower.' : 'Make a mark. See where it goes.'); if(!isGarden) resizeDrawing(); }
function resizeDrawing(){ const rect=drawCanvas.getBoundingClientRect(); if(!rect.width || !rect.height) return; const dpr=Math.min(devicePixelRatio,2); drawCanvas.width=Math.round(rect.width*dpr); drawCanvas.height=Math.round(rect.height*dpr); renderDrawing(); }
function drawArtwork(context: CanvasRenderingContext2D, width: number, height: number, strokes: Stroke[]) {
  context.fillStyle='#fffaf0'; context.fillRect(0,0,width,height);
  for(const stroke of strokes){
    context.strokeStyle=colours[stroke.colour].hex; context.fillStyle=colours[stroke.colour].hex; context.lineWidth=18; context.lineCap='round'; context.lineJoin='round';
    context.beginPath(); stroke.points.forEach(([x,y],i)=>i?context.lineTo(x*width,y*height):context.moveTo(x*width,y*height)); context.stroke();
    if(stroke.points.length===1){ const [x,y]=stroke.points[0]!; context.beginPath(); context.arc(x*width,y*height,9,0,Math.PI*2); context.fill(); }
  }
}
function renderDrawing(){ const rect=drawCanvas.getBoundingClientRect(); if(!rect.width || !rect.height)return; drawCtx.setTransform(drawCanvas.width/rect.width,0,0,drawCanvas.height/rect.height,0,0); drawArtwork(drawCtx,rect.width,rect.height,activeStroke?[...state.strokes,activeStroke]:state.strokes); }

let activeStroke: Stroke|null=null; let pointerId:number|null=null; function point(e:PointerEvent):[number,number]{ const r=drawCanvas.getBoundingClientRect(); return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]; } function finishStroke(){ if(activeStroke){ state.strokes.push(activeStroke); undo.draw=[...state.strokes]; activeStroke=null; const finishedPointer=pointerId; pointerId=null; if(finishedPointer!==null && drawCanvas.hasPointerCapture(finishedPointer))drawCanvas.releasePointerCapture(finishedPointer); renderDrawing(); renderControls(); save(); } }
drawCanvas.addEventListener('pointerdown',e=>{if(state.activity!=='draw'||pointerId!==null)return; pointerId=e.pointerId; drawCanvas.setPointerCapture(pointerId); activeStroke={colour:state.selectedColour,points:[point(e)]}; renderDrawing();}); drawCanvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointerId||!activeStroke)return; activeStroke.points.push(point(e)); renderDrawing();}); ['pointerup','pointercancel','lostpointercapture'].forEach(type=>drawCanvas.addEventListener(type,e=>{if((e as PointerEvent).pointerId===pointerId)finishStroke();}));


async function openStorage(){ try { db=await openDB('magic-colour-garden',1,{upgrade(database){database.createObjectStore('game');}}); const saved: unknown=await db.get('game','current'); if(validSaved(saved)){ state=saved; undo.draw=[...state.strokes]; } } catch { document.querySelector('#saveStatus')!.textContent='Playing here; artwork saving is unavailable.'; } }
let saveChain=Promise.resolve(); let savedSuccessfully=false;
function save(){ const snapshot=structuredClone(state); saveChain=saveChain.catch(()=>{}).then(async()=>{ try { if(!db)throw new Error('Storage unavailable'); await db.put('game',snapshot,'current'); savedSuccessfully=true; document.querySelector('#saveStatus')!.textContent=''; } catch { savedSuccessfully=false; document.querySelector('#saveStatus')!.textContent='Artwork is not saved. You can still play and download your drawing.'; } }); return saveChain; }
document.querySelector<HTMLButtonElement>('#parentButton')!.addEventListener('click',()=>{ finishStroke(); const output=document.createElement('canvas'); const rect=document.querySelector('#stage')!.getBoundingClientRect(); output.width=1200; output.height=Math.round(1200*rect.height/rect.width); const ctx=output.getContext('2d')!; ctx.scale(output.width/rect.width,output.height/rect.height); drawArtwork(ctx,rect.width,rect.height,state.strokes); const a=document.createElement('a'); a.download='magic-colour-garden.png'; a.href=output.toDataURL('image/png'); a.click(); announce('Drawing downloaded.'); });
window.addEventListener('resize',resizeDrawing);
app.inert=true;
openStorage().then(()=>{initGarden();renderControls();renderMode();app.inert=false;});
if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).then(registration => {
  if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration);
  registration.addEventListener('updatefound',()=>{ const worker=registration.installing; worker?.addEventListener('statechange',()=>{ if(worker.state==='installed'){ if(navigator.serviceWorker.controller)showUpdate(registration); else document.querySelector('#saveStatus')!.textContent='Ready to play offline.'; } }); });
  void registration.update().catch(()=>{});
}).catch(()=>{ document.querySelector('#saveStatus')!.textContent='Offline play is not ready yet.'; });
function showUpdate(registration: ServiceWorkerRegistration){ const toast=document.querySelector<HTMLDivElement>('#updateToast')!; toast.hidden=false; document.querySelector<HTMLButtonElement>('#updateButton')!.onclick=async()=>{ finishStroke(); await save(); if(!savedSuccessfully){ announce('Update paused because artwork could not be saved.'); return; } const worker=registration.waiting; if(!worker)return; let reloaded=false; navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!reloaded){reloaded=true;location.reload();}},{once:true}); worker.postMessage({type:'SKIP_WAITING'}); }; }

function paintTarget(id: TargetId) { if (state.activity !== 'garden' || state.garden[id] === state.selectedColour) return; undo.garden.push([id,state.garden[id]]); if (undo.garden.length > 40) undo.garden.shift(); state.garden[id]=state.selectedColour; renderGarden(); garden?.pulse(id); announce(`${colours[state.selectedColour].label} on ${id === 'butterfly' ? 'the butterfly' : 'a flower'}`); renderControls(); save(); }


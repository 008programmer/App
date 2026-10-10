type ColourId = 'pink' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';
type TargetId = 'flower1' | 'flower2' | 'flower3' | 'butterfly';
type Stroke = { colour: ColourId; points: [number, number][] };
type SavedGame = { schemaVersion: 1; selectedColour: ColourId; activity: 'garden' | 'draw'; garden: Record<TargetId, ColourId>; strokes: Stroke[] };

export function validSaved(value: unknown): value is SavedGame {
  if(!value || typeof value!=='object')return false;
  const v=value as SavedGame; const isColour=(c: unknown)=>typeof c==='string' && ['pink','orange','yellow','green','blue','purple'].includes(c);
  return v.schemaVersion===1 && isColour(v.selectedColour) && ['garden','draw'].includes(v.activity) && !!v.garden && ['flower1','flower2','flower3','butterfly'].every(id=>isColour(v.garden[id as TargetId])) && Array.isArray(v.strokes) && v.strokes.every(s=>s && isColour(s.colour) && Array.isArray(s.points) && s.points.length>0 && s.points.every(p=>Array.isArray(p) && p.length===2 && p.every(n=>typeof n==='number' && Number.isFinite(n))));
}

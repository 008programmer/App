import { cpSync, readdirSync, writeFileSync } from 'node:fs';
for (const entry of readdirSync(new URL('../dist/', import.meta.url))) {
  cpSync(new URL(`../dist/${entry}`, import.meta.url), new URL(`../${entry}`, import.meta.url), { recursive: true });
}
writeFileSync(new URL('../.nojekyll', import.meta.url), '');

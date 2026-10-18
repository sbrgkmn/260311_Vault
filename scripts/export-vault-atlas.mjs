import {mkdir,writeFile} from 'node:fs/promises';
import {atlasPlanSVG} from '../serial/vault-atlas.mjs';
const directory=new URL('../output/figures/',import.meta.url);
await mkdir(directory,{recursive:true});
await writeFile(new URL('sixteen-vaults-symmetry-atlas.svg',directory),atlasPlanSVG());
console.log('Updated output/figures/sixteen-vaults-symmetry-atlas.svg');

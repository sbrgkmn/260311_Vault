import {mkdir,writeFile} from 'node:fs/promises';
import {atlasPlanSVG} from '../serial/vault-atlas.mjs';
import {typeAtlasSVG} from '../serial/vault-types.mjs';
const directory=new URL('../output/figures/',import.meta.url);
await mkdir(directory,{recursive:true});
await writeFile(new URL('sixteen-vaults-symmetry-atlas.svg',directory),atlasPlanSVG());
await writeFile(new URL('six-vault-types.svg',directory),typeAtlasSVG());
console.log('Updated sixteen-vaults-symmetry-atlas.svg and six-vault-types.svg in output/figures/');

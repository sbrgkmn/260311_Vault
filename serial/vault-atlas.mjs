import {VAULT_CASES} from './vault-cases.mjs';
import {triangleStudy,assembleTriangles,trianglePlan,symmetryPlan} from './triangle-vault.mjs';

export function atlasPlanSVG(){
  const cells=VAULT_CASES.map((c,i)=>{
    const {params,stages}=triangleStudy({id:c.id,depth:1});
    const diagrams=stages.map((stage,n)=>(n===0?symmetryPlan(params):trianglePlan(assembleTriangles(stage,params),params,{axes:false,shade:false}))
      .replace('<svg ',`<svg x="${n*145+10}" y="70" width="135" height="220" `)).join('');
    return `<g transform="translate(${20+i%4*310},${125+Math.floor(i/4)*340})"><rect width="300" height="325" fill="white" stroke="#ccc"/><text x="12" y="25" font-size="18">${String(i+1).padStart(2,'0')} / ${c.name}</text><text x="12" y="47" font-size="11">${c.type}</text>${diagrams}<text x="25" y="308" font-size="10">Quadrant folds</text><text x="175" y="308" font-size="10">Recursion</text></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1520" viewBox="0 0 1280 1520"><rect width="1280" height="1520" fill="#f5f4ef"/><g font-family="Georgia,serif" fill="#242820"><text x="22" y="43" font-size="30">Sixteen vaults / abstract symmetry and triangulation</text><text x="22" y="74" font-size="14">PDF order. Proposed normalized seeds, not measured rib tracings. Red: seed symmetry; shade: generating quarter.</text><text x="22" y="98" font-size="14">Same flat triangles in plan and 3D. Lincoln uses a full-bay seed; its later refinement is not symmetry-constrained.</text>${cells}<text x="22" y="1505" font-size="12">260311_Vault / Pate-O'Hare review corpus / Proportions, heights and recursive operators remain modelling hypotheses.</text></g></svg>`;
}

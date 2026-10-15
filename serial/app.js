import { FAMILIES, EDGE_LABELS, generateSeries, assembleWedge, parameters, meshOBJ } from './generator.mjs';
import { createViewer, boundsFor } from './viewer.js';

const $ = (selector) => document.querySelector(selector);
const number = (value) => value.toLocaleString('en-US');
const page = document.body.dataset.page;
const gallery = page === 'variations';
const query = new URLSearchParams(location.search);
const initial = Object.fromEntries(['family', 'rise', 'fold', 'decay', 'bays', 'rules', 'cycle'].filter(key => query.has(key)).map(key => [key, query.get(key)]));
let params = parameters(initial);
let assembly = ['wedge', 'bay', 'vault'].includes(query.get('assembly')) ? query.get('assembly') : 'wedge';
let step = Math.max(0, Math.min(5, Math.round(Number(query.get('step') ?? (gallery ? 5 : 1))) || 0));
let mode = gallery || params.family === 'stellar' ? 'clay' : 'surface';
let playing = false;
let playTimer;
let series;
let viewers = [];
let thumbnails = [];
let samples = [];
let sharedBounds;
let rebuildTimer;
const familyOptions = FAMILIES.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
const logo = '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M5 36 12 9 22 20 32 9 39 36 22 29Z M5 36 22 20 39 36 M12 9 22 29 32 9 M22 20V29"/></svg>';
const compass = '<svg class="compass" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 33V8M20 33 5 25M20 33 35 25"/><path d="m18 11 2-3 2 3m10 14 3 0-1 3m-26-3-3 0 1 3"/></svg>';

function header() {
  return `<header class="masthead"><a class="brand" href="./index.html">${logo}<div><strong>SERIAL VAULTS</strong><small>A STUDY IN RECURSIVE FORM</small></div></a><nav aria-label="Study pages"><a href="./rhino.html">Rhino reconstruction</a><a href="./index.html" ${gallery ? '' : 'aria-current="page"'}><span>01</span> Recursive study</a><a href="./variations.html" ${gallery ? 'aria-current="page"' : ''}><span>02</span> Variation atlas</a></nav><a class="legacy" href="../index.html">Original generator &nearr;</a></header>`;
}

function footer() {
  return `<footer class="footnote"><span>AFTER PATE &amp; O'HARE / PHASE II MATERIAL &nbsp; &middot; &nbsp; COMPUTATIONAL INTERPRETATION</span><span>260311_Vault &nbsp; / &nbsp; <a href="./README.md">Rules &amp; method</a></span></footer>`;
}

function displayControls() {
  return `<div class="segmented" role="group" aria-label="Rendering style"><button data-mode="surface" aria-pressed="${mode === 'surface'}">Surface + mesh</button><button data-mode="clay" aria-pressed="${mode === 'clay'}">Clay</button><button data-mode="wire" aria-pressed="${mode === 'wire'}">Wireframe</button></div>`;
}

function range(id, label, min, max, increment, value) {
  return `<div class="control"><label for="${id}">${label}<output for="${id}" id="${id}-value">${Number(value).toFixed(2)}</output></label><input id="${id}" type="range" min="${min}" max="${max}" step="${increment}" value="${value}"></div>`;
}

function seriesControls() {
  return '<section class="edge-rule-controls"><label for="rule-cycle" class="field-label">Repeating rule cycle</label><input id="rule-cycle" type="text" value="'+params.cycle.join(',')+'" aria-describedby="cycle-help"><p id="cycle-help">Use 1 and 2, separated by commas. Example: 1,1,2.</p><p id="cycle-error" role="status"></p>'+params.rules.map((rule,r)=>'<fieldset class="edge-rule"><legend>Rule '+(r+1)+' / '+(r===0?'expansive':'contractive')+' default</legend><table><thead><tr><th>Edge</th><th>Point t</th><th>Vertical &Delta;Y</th></tr></thead><tbody>'+rule.map((edge,e)=>'<tr><th>'+EDGE_LABELS[e]+'</th>'+['t','dy'].map(key=>'<td><input type="number" data-rule="'+r+'" data-edge="'+e+'" data-key="'+key+'" aria-label="Rule '+(r+1)+' edge '+EDGE_LABELS[e]+' '+(key==='t'?'evaluation point':'vertical displacement')+'" min="'+(key==='t'?.1:-1.5)+'" max="'+(key==='t'?.9:1.5)+'" step="0.05" value="'+edge[key].toFixed(2)+'"></td>').join('')+'</tr>').join('')+'</tbody></table></fieldset>').join('')+'<p class="rule-help">t: position along the directed edge (0.5 = midpoint). &Delta;Y: signed height coefficient. Same rule for every triangle in a pass.</p></section>';
}

function recursionHTML() {
  return `${header()}<main><div class="page-heading"><div><p class="eyebrow">01 / Process &amp; transformation</p><h1>One wedge. <em>Symmetric vaults.</em></h1></div><p class="intro">Reconstruct the triangular module first. Inspect its folds, then mirror the exact same geometry into a bay and a serial vault.</p></div>
  <div class="workspace"><aside class="sidebar" aria-label="Generation controls"><section class="seed-section"><div class="section-label">The seed <span>01</span></div><label for="family" class="field-label">Wedge study</label><select id="family">${familyOptions}</select><p class="family-description" id="description"></p><label for="assembly" class="field-label">Assembly</label><select id="assembly"><option value="wedge">1 / Single wedge</option><option value="bay">8 / Mirrored bay</option><option value="vault">8 &times; bays / Serial vault</option></select><label for="bays" class="field-label bay-label">Serial bays</label><select id="bays"><option value="1">1 / Single bay</option><option value="2">2 / Paired bays</option><option value="3">3 / Extended nave</option></select></section>
  <hr class="divider"><section class="parameters-section"><div class="section-label">Transformation <span>02</span></div>${range('rise', 'Vault rise', .5, 3, .01, params.rise)}${range('fold', 'Fold amplitude', 0, 1, .01, params.fold)}${range('decay', 'Detail retention', .35, .85, .01, params.decay)}<button id="reset-parameters" class="small-button">Restore wedge defaults &crarr;</button></section>${seriesControls()}
  <hr class="divider"><section class="rule-section"><div class="section-label">The recursive rule <span>03</span></div><div id="rule-geometry" class="rule-geometry"></div><p class="rule-copy"><strong>Evaluate. Displace. Recurse.</strong><br>Evaluate A, B and C using the active rule. Move each point vertically, reconnect into four triangles, then repeat using the next rule.</p><div class="formula">Wedge: 4<sup>n</sup> faces &middot; Bay: 8 wedges</div><details><summary>About this interpretation</summary><p>Each triangle has one A, B and C edge. Children inherit these labels topologically, not by geometric direction. Shared edges are evaluated once in their inherited direction. Offsets scale by fold amplitude and (0.5 &times; retention) per generation. Rule 1 and Rule 2 repeat in the specified cycle. Expansion/contraction are editable signed displacements, not guaranteed volume changes.</p></details></section></aside>
  <section class="stage" aria-label="Selected vault recursion"><div class="viewport-wrap"><div id="main-view" class="viewport"></div><div class="view-top"><b id="view-title"></b><span id="view-step"></span></div><div class="view-actions"><button id="reset-view" title="Reset worm's-eye camera" aria-label="Reset worm's-eye camera">&#8634;</button><button id="save-png" title="Save model PNG" aria-label="Save model PNG">&#8595;</button></div><div class="view-bottom"><span class="view-caption"><i class="dot"></i> <span id="view-caption">WEDGE / OBLIQUE STUDY</span></span><span>DRAG TO ORBIT &middot; SCROLL TO ZOOM</span>${compass}</div></div>
  <div class="toolbar">${displayControls()}<label class="check"><input type="checkbox" id="highlight"> Color signed folds</label><span class="sign-legend"><i class="positive"></i> Raise <i class="negative"></i> Recess</span></div>
  <div class="sequence"><div class="sequence-head"><div class="section-label">Recursion sequence</div><div class="transport"><button id="previous" aria-label="Previous recursion step">&larr;</button><button id="play" aria-label="Play recursion sequence">&#9655; Play</button><button id="next" aria-label="Next recursion step">&rarr;</button></div></div><div class="steps" role="group" aria-label="Choose a recursion step">${Array.from({ length: 6 }, (_, i) => `<button class="step" data-step="${i}" aria-label="${i ? `Recursion step ${i}` : 'Seed mesh'}" aria-pressed="false"><div class="thumbnail" id="thumb-${i}" aria-hidden="true"></div><span>${String(i).padStart(2, '0')} / ${i ? 'Pass' : 'Seed'}</span></button>`).join('')}</div><p class="step-note" id="step-note" aria-live="polite"></p></div></section></div>
  <section class="reference-check" aria-label="Reference comparison"><div class="section-label">Reference check <span>PDF / PAGE 06</span></div><p>Original rule and five generations, followed by this implementation at the same five passes. Compare the anchored foot, arched outline, and internal triangulation. Numerical displacement remains an approximation.</p><details><summary>Show the original construction rule</summary><img src="./assets/reference-rule.png" alt="PDF Rule One: mark edge midpoints, displace the inner triangle and reconnect to three original corners"></details><img class="reference-generations" src="./assets/reference-generations.png" alt="Pate and O'Hare page 6: five recursive generations of a single wedge"><div class="comparison-strip" id="comparison-strip"></div><p class="reference-credit">Source: Pate &amp; O'Hare, Phase II Material, p. 6. Excerpt shown for geometric comparison. Lower row: live reconstructed wedge, not a tracing.</p></section><div class="below"><div class="metadata"><div><span>Triangles</span><strong id="face-count"></strong></div><div><span>Vertices</span><strong id="vertex-count"></strong></div><div><span>Generation</span><strong id="generation"></strong></div></div><div class="export"><button class="button" id="export-obj">Export OBJ &darr;</button><a class="button" id="diagram-link" href="./diagram.html">Five-step diagram &nearr;</a><a class="button primary" id="atlas-link" href="./variations.html">Compare four variations &nearr;</a></div></div>${footer()}</main>`;
}

function galleryHTML() {
  return `${header()}<main><div class="page-heading"><div><p class="eyebrow">02 / A family of possibilities</p><h1>The variation <em>atlas.</em></h1></div><p class="intro">One module. Four controlled studies.<br>Compare their resulting forms from the same viewpoint beneath the vault.</p></div>
  <div class="gallery-tools"><div class="gallery-controls">${range('gallery-depth', 'Recursion pass', 0, 5, 1, step)}<label class="field-label" for="gallery-bays">Serial bays<select id="gallery-bays"><option value="1">1 bay</option><option value="2" selected>2 bays</option><option value="3">3 bays</option></select></label></div>${displayControls()}<label class="check"><input id="sync" type="checkbox" checked> Link cameras</label><button class="small-button" id="reset-cameras">Reset views &crarr;</button></div>
  <section class="gallery-grid" aria-label="Four resulting vault variations">${FAMILIES.map((f, i) => `<article class="sample"><div class="viewport-wrap"><div class="viewport" id="sample-${i}"></div><div class="view-top"><b>SPECIMEN ${String(i + 1).padStart(2, '0')} &nbsp; / &nbsp; ${f.code}</b><span class="sample-pass"></span></div><div class="view-bottom"><span class="view-caption"><i class="dot"></i> WORM'S-EYE</span><span id="sample-count-${i}"></span>${compass}</div></div><div class="sample-body"><div><h2>${f.name}</h2><p>FOLD ${f.fold.toFixed(2)} &nbsp; / &nbsp; ${f.id === "stellar" ? "FA-FE REGIONS" : "CYCLE " + f.cycle.join(" / ")}</p><p class="sample-series">${f.id === "stellar" ? "SPATIAL DEVELOPMENT / TIERCERON II" : f.cycle.map(n => "R" + n).join(" / ")}</p></div><a class="button inspect" data-family="${f.id}" href="./index.html?family=${f.id}">Explore sequence &nearr;</a></div></article>`).join('')}</section>
  <div class="gallery-note"><p>Each specimen uses the same eight-way symmetric wedge assembly with different proportions or fold series. These are parameter studies, not reconstructions of four historical vault typologies. Bay count, pass and cameras are shared.</p><span>01&ndash;04 &nbsp; / &nbsp; DETERMINISTIC SERIES</span></div>${footer()}</main>`;
}

function reflectURL() {
  const state = gallery ? { bays: params.bays, step } : { family: params.family, rise: params.rise, fold: params.fold, decay: params.decay, rules: JSON.stringify(params.rules), cycle: params.cycle.join(','), bays: params.bays, assembly, step };
  if (!gallery && params.family === 'stellar') { delete state.rules; delete state.cycle; }
  history.replaceState(null, '', `${location.pathname}?${new URLSearchParams(state)}`);
}

function updateParameterLabels() {
  for (const key of ['rise', 'fold', 'decay']) {
    $(`#${key}`).value = params[key];
    $(`#${key}-value`).value = params[key].toFixed(2);
  }
  if (document.activeElement !== $('#rule-cycle')) $('#rule-cycle').value = params.cycle.join(',');
  document.querySelectorAll('[data-rule]').forEach(input => {
    if (document.activeElement !== input) input.value = params.rules[Number(input.dataset.rule)][Number(input.dataset.edge)][input.dataset.key].toFixed(2);
  });
}

// A fixed oblique projection keeps all five reconstructed stages directly comparable.
function wedgeDrawing(mesh, stages, labelEdges = false) {
  const project = (point) => [120 * point[0] + 70 * point[2], -165 * point[1] + 50 * point[2]];
  const all = stages.flatMap(stage => Array.from({ length: stage.positions.length / 3 }, (_, i) => project(stage.positions.slice(i * 3, i * 3 + 3))));
  const minY = Math.min(...all.map(p => p[1]));
  const maxY = Math.max(...all.map(p => p[1]));
  const height = maxY - minY + 40;
  const point = (index) => {
    const [x, y] = project(mesh.positions.slice(index * 3, index * 3 + 3));
    return `${(x + 20).toFixed(2)},${(y - minY + 20).toFixed(2)}`;
  };
  const edges = new Map();
  for (let i = 0; i < mesh.faces.length; i += 3) {
    for (let e = 0; e < 3; e++) {
      const a = mesh.faces[i + e], b = mesh.faces[i + (e + 1) % 3];
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      const old = edges.get(key);
      edges.set(key, { a, b, count: (old?.count || 0) + 1 });
    }
  }
  const paths = [...edges.values()].map(({ a, b, count }) => `<path d="M${point(a)}L${point(b)}" stroke-width="${count === 1 ? 1.25 : .45}" opacity="${count === 1 ? 1 : .65}"/>`).join('');
  if (labelEdges) {
    const labels = Object.values(mesh.edgeRules).map(edge => {
      const [ax, ay] = point(edge.a).split(',').map(Number), [bx, by] = point(edge.b).split(',').map(Number);
      return `<path d="M${ax},${ay}L${bx},${by}" stroke="#d29162" stroke-width="1" marker-end="url(#edge-arrow)"/><text x="${(ax + bx) / 2 + 5}" y="${(ay + by) / 2 - 5}" fill="#f2d4ad" font-size="14">${edge.label}</text>`;
    }).join('');
    return `<svg viewBox="0 0 230 ${height}" role="img" aria-label="Seed edge directions: A springing to crown, B crown to shoulder, C shoulder to springing"><defs><marker id="edge-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0L6,3L0,6" fill="#d29162"/></marker></defs>${labels}</svg>`;
  }
  return `<svg viewBox="0 0 230 ${height}" role="img" aria-label="Reconstructed wedge pass ${mesh.level}"><path d="M${point(mesh.seedIndices?.[0] ?? 0)}L${point(mesh.seedIndices?.[1] ?? 1)}L${point(mesh.seedIndices?.[2] ?? 2)}Z" fill="none" stroke="#b28f66" stroke-dasharray="3 4" stroke-width=".6"/><g fill="none" stroke="#deddd2">${paths}</g><circle cx="20" cy="${20 - minY}" r="2" fill="#d29162"/></svg>`;
}

function buildStudy() {
  params = parameters(params);
  const family = FAMILIES.find(f => f.id === params.family);
  const result = generateSeries(params);
  series = { ...result, stages: assembly === 'wedge' ? result.wedgeStages : assembly === 'bay' ? result.wedgeStages.map(mesh => assembleWedge(mesh, 1)) : result.stages };
  [...viewers, ...thumbnails].forEach(viewer => viewer.setView(assembly === 'wedge' ? 'wedge' : 'vault'));
  const tierceron = params.family === 'stellar';
  $('#rule-geometry').innerHTML = wedgeDrawing(result.wedgeStages[0], result.wedgeStages, !tierceron);
  $('.edge-rule-controls').hidden = tierceron;
  $('.rule-copy').textContent = tierceron ? 'FA-FE operate together in fixed face regions. Three long springing faces feed two crown-web developments. Each generation uses its parent edge height span, rather than alternating a global up/down rule.' : 'Evaluate A, B and C using the active rule. Move vertically, reconnect four children, then apply the next rule.';
  $('.formula').innerHTML = tierceron ? 'Wedge: 12 &times; 4<sup>n</sup> faces' : 'Wedge: 4<sup>n</sup> faces';
  $('.rule-section details p').textContent = tierceron ? 'Targeted approximation of the Tierceron II study: PDF pages 10-11 (face developments), 15 (regions), 18 (assembled result). The compound seed and numerical coefficients are inferred. Fixed region identity replaces whole-pass alternation. Shared region interfaces use one averaged displacement; no smoothing is applied.' : 'Each triangle inherits A/B/C labels. Shared edges are evaluated once in the inherited direction. The two complete rules repeat in the specified cycle.';
  $('.reference-generations').src = tierceron ? './assets/tierceron2-target.png' : './assets/reference-generations.png';
  $('.reference-generations').alt = tierceron ? 'PDF page 18: target Tierceron II vault above and below' : 'PDF page 6: wedge development sequence';
  $('.reference-check details img').src = tierceron ? './assets/tierceron2-regions.png' : './assets/reference-rule.png';
  $('.reference-check details img').alt = tierceron ? 'PDF page 15: compound wedge with A-E face regions' : 'PDF page 6: triangle replacement rule';
  $('.reference-check .section-label span').textContent = tierceron ? 'PDF / PAGES 15 + 18' : 'PDF / PAGE 06';
  $('.reference-check > p').textContent = tierceron ? 'Target: Tierceron II, page 18. Below: the five generated compound-wedge passes. Open the construction reference to inspect the source A-E region layout. This is a visual approximation, not a recovered definition.' : 'Source rule and five generations, followed by the generated wedge at each pass.';
  $('.reference-credit').textContent = tierceron ? "Pate & O'Hare / Phase II Material / Tierceron II. Source image above; generated geometry below." : "Pate & O'Hare / Phase II Material / page 6. Source above; generated geometry below.";
  const cameraLabel = assembly === 'wedge' ? 'Reset wedge camera' : "Reset worm's-eye camera";
  $('#reset-view').setAttribute('aria-label', cameraLabel);
  $('#reset-view').title = cameraLabel;
  $('#assembly').value = assembly;
  $('#bays').disabled = assembly !== 'vault';
  $('#diagram-link').style.display = tierceron ? '' : 'none';
  $('#diagram-link').href = './diagram.html?' + new URLSearchParams({rise:params.rise,fold:params.fold,decay:params.decay,bays:params.bays});
  $('#view-caption').textContent = assembly === 'wedge' ? 'WEDGE / OBLIQUE STUDY' : "WORM'S-EYE / SYMMETRIC ASSEMBLY";
  $('#comparison-strip').innerHTML = result.wedgeStages.slice(1).map(mesh => `<div>${wedgeDrawing(mesh, result.wedgeStages)}<span>RECONSTRUCTION / 0${mesh.level}</span></div>`).join('');
  sharedBounds = boundsFor(series.stages);
  $('#description').textContent = family.description;
  $('#view-title').textContent = `${family.code} / ${family.name.toUpperCase()}`;
  $('#family').value = params.family;
  $('#bays').value = params.bays;
  updateParameterLabels();
  thumbnails.forEach((viewer, i) => viewer.setMesh(series.stages[i], sharedBounds));
  showStep(step);
  viewers[0].reset();
  thumbnails.forEach(viewer => viewer.reset());
}

function showStep(value) {
  step = value;
  const mesh = series.stages[step];
  viewers[0].setMesh(mesh, sharedBounds);
  viewers[0].setDisplay(mode, $('#highlight').checked);
  $('#face-count').textContent = number(mesh.faces.length / 3);
  $('#vertex-count').textContent = number(mesh.positions.length / 3);
  $('#generation').textContent = `${String(step).padStart(2, '0')} / 05`;
  $('#view-step').textContent = step ? `PASS ${step} / ${params.family === 'stellar' ? 'FA-FE' : 'RULE ' + mesh.ruleNumber}` : 'THE SEED';
  $('#previous').disabled = step === 0;
  $('#next').disabled = step === 5;
  document.querySelectorAll('.step').forEach(button => button.setAttribute('aria-pressed', Number(button.dataset.step) === step));
  document.querySelectorAll('.edge-rule').forEach((panel, i) => panel.classList.toggle('active', mesh.ruleNumber === i + 1));
  document.querySelectorAll('.step span').forEach((label, i) => { label.textContent = i ? '0' + i + (params.family === 'stellar' ? ' / FA-FE' : ' / R' + params.cycle[(i - 1) % params.cycle.length]) : '00 / Seed'; });
  const raised = mesh.moves.filter(move => move.offset > 1e-10).length;
  const lowered = mesh.moves.filter(move => move.offset < -1e-10).length;
  $('#step-note').textContent = step === 0 ? `Fixed anchors per wedge: springing, shoulder and crown. ${mesh.moduleCount} identical module(s).` : `Pass ${step} / Rule ${mesh.ruleNumber}: ${number(raised)} points raised, ${number(lowered)} recessed. ${mesh.moduleCount} identical module(s), ${number(mesh.faces.length / 3)} faces. Seed corners and earlier vertices stay fixed.`;
  $('#atlas-link').href = `./variations.html?bays=${params.bays}&step=${step}`;
  reflectURL();
}

function pause() {
  playing = false;
  clearInterval(playTimer);
  if ($('#play')) { $('#play').innerHTML = '&#9655; Play'; $('#play').setAttribute('aria-label', 'Play recursion sequence'); }
}

function queueBuild() {
  pause();
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => { buildStudy(); }, 90);
}

function download(name, content) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function initializeStudy() {
  viewers = [createViewer($('#main-view'), { view: assembly === 'wedge' ? 'wedge' : 'vault' })];
  thumbnails = Array.from({ length: 6 }, (_, i) => createViewer($(`#thumb-${i}`), { compact: true }));
  buildStudy();
  $('#assembly').addEventListener('change', event => { assembly = event.target.value; queueBuild(); });
  $('#family').addEventListener('change', e => { params = parameters({ family: e.target.value, bays: params.bays }); queueBuild(); });
  $('#bays').addEventListener('change', e => { params.bays = Number(e.target.value); queueBuild(); });
  for (const key of ['rise', 'fold', 'decay']) {
    $(`#${key}`).addEventListener('input', e => { params[key] = Number(e.target.value); $(`#${key}-value`).value = params[key].toFixed(2); queueBuild(); });
  }
  const updateCycle = event => {
    const value = event.target.value.trim();
    if (!/^[12](\s*,\s*[12]){0,11}$/.test(value)) {
      $('#cycle-error').textContent = 'Enter 1-12 rule numbers (1 or 2), separated by commas.';
      event.target.setAttribute('aria-invalid', 'true');
      return;
    }
    $('#cycle-error').textContent = '';
    event.target.removeAttribute('aria-invalid');
    params.cycle = value.split(',').map(Number);
    queueBuild();
  };
  $('#rule-cycle').addEventListener('input', updateCycle);
  $('#rule-cycle').addEventListener('change', updateCycle);
  document.querySelectorAll('[data-rule]').forEach(input => {
    const update = () => {
      if (!Number.isFinite(input.valueAsNumber)) return;
      const value = Math.max(Number(input.min), Math.min(Number(input.max), input.valueAsNumber));
      params.rules[Number(input.dataset.rule)][Number(input.dataset.edge)][input.dataset.key] = value;
      queueBuild();
    };
    input.addEventListener('input', update);
    input.addEventListener('change', () => { update(); input.value = params.rules[Number(input.dataset.rule)][Number(input.dataset.edge)][input.dataset.key].toFixed(2); });
  });
  $('#reset-parameters').addEventListener('click', () => { params = parameters({ family: params.family, bays: params.bays }); queueBuild(); });
  document.querySelectorAll('.step').forEach(button => button.addEventListener('click', () => { pause(); showStep(Number(button.dataset.step)); }));
  $('#previous').addEventListener('click', () => { pause(); showStep(Math.max(0, step - 1)); });
  $('#next').addEventListener('click', () => { pause(); showStep(Math.min(5, step + 1)); });
  $('#play').addEventListener('click', () => {
    if (playing) { pause(); return; }
    playing = true;
    if (step === 5) showStep(0);
    $('#play').innerHTML = '&#10074;&#10074; Pause';
    $('#play').setAttribute('aria-label', 'Pause recursion sequence');
    playTimer = setInterval(() => { if (step < 5) showStep(step + 1); if (step === 5) pause(); }, 1150);
  });
  $('#reset-view').addEventListener('click', () => viewers[0].reset());
  $('#save-png').addEventListener('click', () => viewers[0].saveImage(`vault-${params.family}-pass-${step}.png`));
  $('#highlight').addEventListener('change', () => viewers[0].setDisplay(mode, $('#highlight').checked));
  $('#export-obj').addEventListener('click', () => download(`vault-${params.family}-pass-${step}.obj`, meshOBJ(series.stages[step])));
}

function buildGallery() {
  samples = FAMILIES.map(f => generateSeries({ family: f.id, bays: params.bays, depth: 5 }));
  const bounds = boundsFor(samples.flatMap(sample => sample.stages));
  samples.forEach((sample, i) => {
    const mesh = sample.stages[step];
    viewers[i].setMesh(mesh, bounds);
    viewers[i].setDisplay(mode, false);
    viewers[i].reset();
    $(`#sample-count-${i}`).textContent = `${number(mesh.faces.length / 3)} TRIANGLES`;
  });
  document.querySelectorAll('.sample-pass').forEach(label => { label.textContent = `PASS ${String(step).padStart(2, '0')}`; });
  document.querySelectorAll('.inspect').forEach(link => { link.href = `./index.html?family=${link.dataset.family}&bays=${params.bays}&assembly=wedge&step=${step}`; });
  $('#gallery-depth-value').value = `${String(step).padStart(2, '0')} / 05`;
  reflectURL();
}

function initializeGallery() {
  $('#gallery-bays').value = params.bays;
  viewers = FAMILIES.map((family, i) => createViewer($(`#sample-${i}`), {
    onCameraChange(view) { if ($('#sync').checked) viewers.forEach((viewer, j) => { if (i !== j) viewer.syncCamera(view); }); },
  }));
  buildGallery();
  $('#gallery-depth').addEventListener('input', event => {
    step = Number(event.target.value);
    $('#gallery-depth-value').value = `${String(step).padStart(2, '0')} / 05`;
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(buildGallery, 90);
  });
  $('#gallery-bays').addEventListener('change', event => { params.bays = Number(event.target.value); buildGallery(); });
  $('#reset-cameras').addEventListener('click', () => viewers.forEach(viewer => viewer.reset()));
}

try {
  $('#app').innerHTML = gallery ? galleryHTML() : recursionHTML();
  if (gallery) initializeGallery(); else initializeStudy();
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b === button));
    viewers.forEach(viewer => viewer.setDisplay(mode, !gallery && $('#highlight').checked));
  }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', () => { pause(); clearTimeout(rebuildTimer); [...viewers, ...thumbnails].forEach(viewer => viewer.dispose()); });
  window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
} catch (error) {
  console.error(error);
  const alert = document.createElement('p');
  alert.className = 'error';
  alert.setAttribute('role', 'alert');
  alert.textContent = 'The 3D view could not start. Enable WebGL / hardware acceleration in your browser, then reload. ' + error.message;
  $('#app').prepend(alert);
}

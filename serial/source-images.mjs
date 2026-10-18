export const SOURCE_IMAGES={
  exeter:{file:'exeter-source.jpg',width:2048,height:1060,crop:[298,72,380,690],title:'Exeter nave / bay C16',kind:'Colour plan view of survey mesh',credit:'Tracing the Past, University of Liverpool',url:'https://www.tracingthepast.org.uk/2021/04/07/exeter_site_by_site/',original:'https://www.tracingthepast.org.uk/content/wp-content/uploads/2021/02/NAVE-CAROUSEL-4-5-2048x1060.jpg',rights:'Copyright Tracing the Past. Local research reference; publication permission has not been established.'},
  wells:{file:'wells-source.jpg',width:2048,height:961,crop:[637,99,329,636],title:'Wells choir / bay C5',kind:'Colour plan view of survey mesh',credit:'Tracing the Past, University of Liverpool',url:'https://www.tracingthepast.org.uk/2021/04/08/wells_site_by_site/',original:'https://www.tracingthepast.org.uk/content/wp-content/uploads/2021/03/CAROUSEL-CHOIR-4-6-2048x961.jpg',rights:'Copyright Tracing the Past. Local research reference; publication permission has not been established.'},
  gloucester:{file:'gloucester-source.jpg',width:2048,height:961,crop:[620,180,430,466],title:'Gloucester east cloister / bay E3',kind:'Colour plan view of survey mesh',credit:'Tracing the Past, University of Liverpool',url:'https://www.tracingthepast.org.uk/2021/04/07/gloucester_site_by_site/',original:'https://www.tracingthepast.org.uk/content/wp-content/uploads/2021/04/CLOISTER-CAROUSEL-1-2-2048x961.jpg',rights:'Copyright Tracing the Past. Local research reference; publication permission has not been established.'},
  reims:{file:'reims-source.jpg',title:'Reims nave / ceiling photograph',kind:'Perspective photograph, not an orthographic plan',credit:'Dguendel, 2017 / CC BY 4.0',url:'https://commons.wikimedia.org/wiki/File:Reims,_cathedral,_the_vault.JPG',original:'https://upload.wikimedia.org/wikipedia/commons/6/6d/Reims%2C_cathedral%2C_the_vault.JPG',rights:'CC BY 4.0: https://creativecommons.org/licenses/by/4.0/ . Original photograph unchanged.'},
};
const survey=(file,width,height,crop,title,url,original)=>({file,width,height,crop,title,kind:'Single-bay survey plan',status:'survey',credit:'Tracing the Past, University of Liverpool',url,original,rights:'Copyright Tracing the Past. Local research reference; publication permission has not been established.'});
Object.assign(SOURCE_IMAGES,{
  lincoln:survey('lincoln-source.jpg',1024,481,[303,38,192,344],"Lincoln / St Hugh's Choir C9",'https://www.tracingthepast.org.uk/2021/04/09/lincoln_site_by_site/','https://www.tracingthepast.org.uk/content/wp-content/uploads/2021/03/CAROUSEL-CHOIR-3-3-1024x481.jpg'),
  ely:survey('ely-c8-plan.jpg',330,640,[0,0,330,640],"Ely / Hotham's Choir C8",'https://www.tracingthepast.org.uk/2021/04/07/ely_site_by_site/','https://www.tracingthepast.org.uk/content/wp-content/uploads/2021/02/CAROUSEL-HOTHAM-4-1-2048x961.jpg'),
  westminster:survey('westminster-source.jpg',1024,530,[127,55,227,305],'Westminster / Henry VII Chapel H3','https://www.tracingthepast.org.uk/2021/04/08/westminster_site_by_site/','https://www.tracingthepast.org.uk/content/wp-content/uploads/2021/04/CAROUSEL-HVII-4-1024x530.jpg'),
  'gloucester-net':survey('gloucester-presbytery-source.jpg',1024,480,[171,45,173,302],'Gloucester / presbytery C7','https://www.tracingthepast.org.uk/2021/04/07/gloucester_site_by_site/','https://www.tracingthepast.org.uk/content/wp-content/uploads/2021/03/CAROUSEL-PRESBYTERY-1-3-1024x480.jpg'),
});
for(const id of ['exeter','wells','gloucester'])SOURCE_IMAGES[id].status='survey';
Object.assign(SOURCE_IMAGES,{
  "reims": {
    "file": "reims-generated-plan.png",
    "width": 1024,
    "height": 1536,
    "crop": [
      0,
      0,
      1024,
      1536
    ],
    "rotation": 0,
    "title": "Reims / single ceiling bay",
    "kind": "Generated orthographic reconstruction from the source photograph",
    "status": "generated",
    "credit": "Dguendel / CC BY 4.0",
    "url": "https://commons.wikimedia.org/wiki/File:Reims,_cathedral,_the_vault.JPG",
    "original": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Reims%2C_cathedral%2C_the_vault.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original",
    "rights": "AI-generated interpretive reconstruction based on the CC BY 4.0 source photograph. Not survey data; rib topology must be checked against the original."
  },
  "amiens": {
    "file": "amiens-generated-plan.png",
    "width": 1024,
    "height": 1536,
    "crop": [
      0,
      0,
      1024,
      1536
    ],
    "rotation": 0,
    "title": "Amiens / single ceiling bay",
    "kind": "Generated orthographic reconstruction from the source photograph",
    "status": "generated",
    "credit": "Gzen92 / CC BY-SA 4.0",
    "url": "https://commons.wikimedia.org/wiki/File:Cath%C3%A9drale_Notre-Dame_-_int%C3%A9rieur_-_plafond_(Amiens).jpg",
    "original": "https://upload.wikimedia.org/wikipedia/commons/d/d0/Cath%C3%A9drale_Notre-Dame_-_int%C3%A9rieur_-_plafond_%28Amiens%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original",
    "rights": "AI-generated interpretive reconstruction based on the CC BY-SA 4.0 source photograph. Original source retained; the generated bay requires historical geometry review."
  },
  "chartres": {
    "file": "chartres-colour.jpg",
    "width": 1920,
    "height": 1485,
    "crop": [
      775,
      250,
      400,
      1000
    ],
    "rotation": 0,
    "title": "Chartres / single ceiling bay",
    "kind": "Colour ceiling photograph; perspective retained",
    "status": "photo",
    "credit": "Zairon / CC BY-SA 4.0",
    "url": "https://commons.wikimedia.org/wiki/File:Chartres_Cath%C3%A9drale_Notre-Dame_de_Chartres_Innen_Langhaus_Gew%C3%B6lbe.jpg",
    "original": "https://upload.wikimedia.org/wikipedia/commons/9/9f/Chartres_Cath%C3%A9drale_Notre-Dame_de_Chartres_Innen_Langhaus_Gew%C3%B6lbe.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original",
    "rights": "CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0. Display cropped and rotated; original retained."
  },
  "bristol": {
    "file": "bristol-colour.jpg",
    "width": 1920,
    "height": 1440,
    "crop": [
      490,
      0,
      930,
      1440
    ],
    "rotation": 0,
    "title": "Bristol / single ceiling bay",
    "kind": "Colour ceiling photograph; perspective retained",
    "status": "photo",
    "credit": "Kognos / CC BY-SA 4.0",
    "url": "https://commons.wikimedia.org/wiki/File:Bristol_Cathedral_chancel_vault_01.jpg",
    "original": "https://upload.wikimedia.org/wikipedia/commons/6/65/Bristol_Cathedral_chancel_vault_01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original",
    "rights": "CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0. Display cropped and rotated; original retained."
  },
  "winchester": {
    "file": "winchester-generated-plan.png",
    "width": 1024,
    "height": 1536,
    "crop": [
      0,
      0,
      1024,
      1536
    ],
    "rotation": 0,
    "title": "Winchester / single ceiling bay",
    "kind": "Generated orthographic reconstruction from the source photograph",
    "status": "generated",
    "credit": "Benjamin Smith / CC BY-SA 4.0",
    "url": "https://commons.wikimedia.org/wiki/File:Winchester_-_Cathedral_-_Vault.jpg",
    "original": "https://upload.wikimedia.org/wikipedia/commons/d/d6/Winchester_-_Cathedral_-_Vault.jpg",
    "rights": "AI-generated interpretive reconstruction based on the CC BY-SA 4.0 source photograph. Not survey data; rib topology must be checked against the original."
  },
  "sherborne": {
    "file": "sherborne-colour.jpg",
    "width": 1920,
    "height": 1229,
    "crop": [
      580,
      205,
      680,
      850
    ],
    "rotation": 0,
    "title": "Sherborne / single ceiling bay",
    "kind": "Colour ceiling photograph; perspective retained",
    "status": "photo",
    "credit": "JackPeasePhotography / CC BY 2.0",
    "url": "https://commons.wikimedia.org/wiki/File:Sherborne_Abbey_-_Fan_vault.jpg",
    "original": "https://upload.wikimedia.org/wikipedia/commons/4/43/Sherborne_Abbey_-_Fan_vault.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original",
    "rights": "CC BY 2.0: https://creativecommons.org/licenses/by/2.0. Display cropped and rotated; original retained."
  },
  "kings": {
    "file": "kings-generated-plan.png",
    "width": 977,
    "height": 1609,
    "crop": [
      0,
      0,
      977,
      1609
    ],
    "rotation": 0,
    "title": "King's College Chapel / single ceiling bay",
    "kind": "Generated orthographic reconstruction from the source photograph",
    "status": "generated",
    "credit": "Hadrianus1959 / CC BY-SA 4.0",
    "url": "https://commons.wikimedia.org/wiki/File:King%27s_College,_Cambridge_(vault).jpg",
    "original": "https://upload.wikimedia.org/wikipedia/commons/e/e3/King%27s_College%2C_Cambridge_%28vault%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original",
    "rights": "AI-generated interpretive reconstruction based on the CC BY-SA 4.0 source photograph. Not survey data; rib topology must be checked against the original."
  },
  "st-giles": {
    "file": "st-giles-generated-plan.png",
    "width": 1024,
    "height": 1536,
    "crop": [
      0,
      0,
      1024,
      1536
    ],
    "title": "St Giles / single nave bay",
    "kind": "Generated orthographic reconstruction from the source photograph",
    "status": "generated",
    "credit": "Lawrence OP / CC BY-NC-ND 2.0",
    "url": "https://www.flickr.com/photos/paullew/4936627897",
    "original": "https://live.staticflickr.com/4078/4936627897_c3a502596b.jpg",
    "rights": "AI-generated interpretive reconstruction informed by a CC BY-NC-ND 2.0 source. Do not publish this derivative without confirming permission; not survey data."
  },
  "gloucester-early": {
    "file": "gloucester-colour-plan.jpg",
    "width": 2240,
    "height": 958,
    "crop": [
      600,
      355,
      125,
      235
    ],
    "title": "Gloucester / quadripartite nave bay",
    "kind": "Colour survey ceiling plan",
    "status": "survey",
    "credit": "Tracing the Past, University of Liverpool",
    "url": "https://www.tracingthepast.org.uk/2021/04/07/gloucester_site_by_site/",
    "original": "https://www.tracingthepast.org.uk/content/wp-content/uploads/2021/03/TtP_Gloucester_ortho_plan-2240x958.jpg",
    "rights": "Copyright Tracing the Past. Publication permission has not been established."
  },
  "gloucester-net": {
    "file": "gloucester-ii-c7-plan.jpg",
    "width": 700,
    "height": 1240,
    "crop": [
      0,
      0,
      700,
      1240
    ],
    "title": "Gloucester / presbytery net bay",
    "kind": "Orthographic mesh survey plan of bay C7",
    "status": "survey",
    "credit": "Tracing the Past, University of Liverpool",
    "url": "https://www.tracingthepast.org.uk/2021/04/07/gloucester_site_by_site/",
    "original": "https://www.tracingthepast.org.uk/content/wp-content/uploads/2021/03/CAROUSEL-PRESBYTERY-1-3-2048x961.jpg",
    "rights": "Copyright Tracing the Past. C7 was cropped from the published high-resolution orthographic mesh plan and contrast-normalized for comparative display; publication permission has not been established."
  }
});
const attachedPlan=(file,width,height,title,reference,credit)=>({
  file,width,height,crop:[0,0,width,height],title,
  kind:'Generated orthographic reconstruction from the supplied photograph',status:'generated',
  credit,url:'./assets/history/'+reference,original:'./assets/history/'+reference,
  rights:'Interpretive reconstruction from a user-supplied photograph. Original photograph retained with its supplied attribution; publication rights have not been established.'
});
Object.assign(SOURCE_IMAGES,{
  wells:attachedPlan('wells-reference-plan.png',1024,1536,'Wells / single choir bay','wells-attached-reference.jpg','User-supplied Wells photograph'),
  'gloucester-net':attachedPlan('gloucester-net-reference-plan.png',1086,1448,'Gloucester / single presbytery net bay','gloucester-net-attached-reference.jpg','User-supplied Gloucester photograph'),
  westminster:attachedPlan('westminster-single-bay-plan.png',958,1642,'Westminster / one bay between adjacent column lines','westminster-attached-reference.jpg','David Lambert / supplied photograph'),
});
let clipSequence=0;
export function sourceVisual(id){
  const s=SOURCE_IMAGES[id],file='./assets/history/'+s.file;
  if(!s.crop)return `<img src="${file}" alt="${s.title}">`;
  const [x,y,w,h]=s.crop,rotation=s.rotation||0,rw=rotation%180?h:w,rh=rotation%180?w:h,transform=rotation===90?`translate(${h},0) rotate(90)`:rotation===180?`translate(${w},${h}) rotate(180)`:rotation===270?`translate(0,${w}) rotate(270)`:"",clip='source-clip-'+(++clipSequence);
  // Explicit clipping prevents neighboring bays appearing in SVG letterbox space.
  return `<svg viewBox="0 0 ${rw} ${rh}" role="img" aria-label="${s.title}"><defs><clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><g transform="${transform} translate(${-x},${-y})"><image href="${file}" width="${s.width}" height="${s.height}" clip-path="url(#${clip})"/></g></svg>`;
}
export function sourceFigure(id){
  const s=SOURCE_IMAGES[id],file='./assets/history/'+s.file;
  const label=s.status==='survey'?'SURVEY PLAN':s.status==='generated'?'GENERATED RECONSTRUCTION':'COLOUR CEILING PHOTO';
  return `<figure><a class="source-photo" href="${file}" target="_blank" rel="noopener">${sourceVisual(id)}</a><figcaption><span class="source-status ${s.status}">${label}</span><br>01 / ${s.title}<br>${s.kind}. Original source retained.<br><a href="${s.url}" target="_blank" rel="noopener">${s.credit}</a></figcaption></figure>`;
}

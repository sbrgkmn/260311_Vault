import {writeFile, mkdir, readFile} from 'node:fs/promises';
const headers={'User-Agent':'VaultResearch/1.0 (educational local vault typology study)'};
const api=async(domain,params)=>{
  const response=await fetch(`https://${domain}/w/api.php?${new URLSearchParams({...params,format:'json',origin:'*'})}`,{headers});
  if(!response.ok)throw new Error(`${response.status}: ${domain}`);
  return response.json();
};
if(process.argv[2]==='discover'){
  const result=await api('en.wikipedia.org',{action:'parse',page:decodeURIComponent(process.argv[3]||'Rib vault'),prop:'images'});
  await mkdir('tmp',{recursive:true});
  await writeFile('tmp/wikipedia-images.json',JSON.stringify(result,null,2));
  console.log(result.parse.images.join('\n'));
}else{
  const choices=JSON.parse(await readFile(new URL('./wikimedia-choices.json',import.meta.url),'utf8')),photos={};
  const previous=JSON.parse(await readFile('serial/ceiling-photos.json','utf8').catch(()=>'{}'));
  const overrides=JSON.parse(await readFile('serial/ceiling-photo-overrides.json','utf8').catch(()=>'{}'));
  const result=await api('commons.wikimedia.org',{action:'query',titles:Object.values(choices).map(t=>'File:'+t).join('|'),prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'1200'});
  const pages=Object.values(result.query.pages);
  await mkdir('serial/assets/history/commons',{recursive:true});
  for(const [id,title] of Object.entries(choices)){
    if(overrides[id]){photos[id]=overrides[id];console.log(id,'retained external reference');continue;}
    const page=pages.find(p=>p.title.replaceAll('_',' ')===('File:'+title).replaceAll('_',' ')),info=page?.imageinfo?.[0];
    if(!info)throw new Error(`Missing image: ${title}`);
    const meta=info.extmetadata,plain=s=>(s||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim();
    const url=info.thumburl||info.url,file=`${id}.jpg`;
    try{
      if(previous[id]?.title!==title)throw new Error('Reference changed');
      await readFile(`serial/assets/history/commons/${file}`);
    }catch{
      const response=await fetch(url,{headers});
      if(!response.ok)throw new Error(`${response.status}: ${url}`);
      await writeFile(`serial/assets/history/commons/${file}`,Buffer.from(await response.arrayBuffer()));
    }
    photos[id]={file:'commons/'+file,title,credit:plain(meta.Artist?.value),license:plain(meta.LicenseShortName?.value),licenseUrl:meta.LicenseUrl?.value||'',url:info.descriptionurl,original:info.url,description:plain(meta.ImageDescription?.value),accessed:new Date().toISOString().slice(0,10)};
    console.log(id,photos[id].license);
  }
  await writeFile('serial/ceiling-photos.json',JSON.stringify(photos,null,2)+'\n');
}

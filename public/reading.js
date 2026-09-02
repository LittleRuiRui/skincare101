(() => {
  const button=document.getElementById('compare-language');
  if(!button)return;
  button.hidden=false;
  let loaded=false;
  button.addEventListener('click',async()=>{
    if(button.disabled)return;
    const status=document.getElementById('reading-status');
    status.textContent='';
    if(!loaded){
      button.disabled=true;
      try{
        const url=new URL(button.dataset.alternate,location.href);
        if(url.origin!==location.origin)throw new Error('Unexpected origin');
        const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
        if(!response.ok)throw new Error('Translation unavailable');
        const alternate=new DOMParser().parseFromString(await response.text(),'text/html');
        const pairs=new Map([...alternate.querySelectorAll('[data-pair]')].map(el=>[el.dataset.pair,el]));
        const originals=[...document.querySelectorAll('[data-pair]')];
        if(originals.some(el=>!pairs.has(el.dataset.pair)))throw new Error('Translation mismatch');
        for(const original of originals){
          const source=pairs.get(original.dataset.pair);
          const translation=document.createElement('span');
          translation.className='translation';translation.lang=source.lang;
          translation.textContent=source.textContent;original.append(translation);
        }
        loaded=true;
      }catch{status.textContent=button.dataset.error;return;}
      finally{button.disabled=false;}
    }
    const active=button.getAttribute('aria-pressed')!=='true';
    document.body.classList.toggle('compare-languages',active);
    button.setAttribute('aria-pressed',String(active));
    button.textContent=active?button.dataset.hide:button.dataset.show;
  });
})();

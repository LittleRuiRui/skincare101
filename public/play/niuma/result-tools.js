(()=>{
  const ink='#25211d',paper='#fff8e8',pink='#f5a6bd',yellow='#ffd873';
  const pageUrl='https://peacedskin.com/play/niuma/';
  const xhsUrl='https://xhslink.cn/m/Aih15IOXFXB';
  function wrap(ctx,text,x,y,maxWidth,lineHeight,maxLines=20){const lines=[];for(const paragraph of String(text||'').split('\n')){if(!paragraph){lines.push('');continue}let line='';for(const ch of [...paragraph]){const test=line+ch;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=ch}else line=test}if(line)lines.push(line)}const visible=lines.slice(0,maxLines);visible.forEach((line,index)=>ctx.fillText(line,x,y+index*lineHeight));return y+visible.length*lineHeight}
  function rounded(ctx,x,y,w,h,r,fill,stroke=ink){ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=4;ctx.stroke()}ctx.restore()}
  function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src})}
  function drawCover(ctx,img,x,y,w,h){const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight),sw=w/scale,sh=h/scale,sx=(img.naturalWidth-sw)/2,sy=(img.naturalHeight-sh)/2;ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h)}
  async function makeCard(){
    const code=document.querySelector('.code')?.textContent?.trim()||'NIUMA';
    const name=document.querySelector('.subtitle')?.textContent?.trim()||'打工牛马';
    const punch=document.querySelector('.punch')?.innerText?.trim()||'';
    const diagnosis=document.querySelector('.diag')?.innerText?.trim()||'';
    const verdict=document.querySelector('.verdict')?.innerText?.replace('牛马国际评级委员会鉴定：','').trim()||'';
    const artSrc=document.querySelector('.personality-art img')?.getAttribute('src');let art=null,qr=null;
    if(artSrc){try{art=await loadImage(new URL(artSrc,location.href).href)}catch(e){art=null}}
    try{qr=await loadImage(new URL('images/test-qr.png',location.href).href)}catch(e){qr=null}
    const content=document.createElement('canvas');content.width=1080;content.height=2400;const ctx=content.getContext('2d');
    let y=105;ctx.fillStyle=ink;ctx.font='800 27px system-ui, sans-serif';ctx.fillText('牛马国际评级委员会 · 职场物种报告',92,y);
    y+=116;ctx.fillStyle=pink;ctx.font='950 112px system-ui, sans-serif';ctx.fillText(code,92,y);
    y+=65;ctx.fillStyle=ink;ctx.font='900 45px system-ui, sans-serif';y=wrap(ctx,name,92,y,896,54,2)+20;
    if(art){const x=92,w=896,h=690;rounded(ctx,x,y,w,h,28,'#f7efce');ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,26);ctx.clip();drawCover(ctx,art,x,y,w,h);ctx.restore();y+=h+24}
    ctx.font='850 31px system-ui, sans-serif';rounded(ctx,82,y,916,116,24,'#ffdce7');wrap(ctx,punch,116,y+45,848,40,2);y+=140;
    ctx.fillStyle=ink;ctx.font='650 25px system-ui, sans-serif';y=wrap(ctx,diagnosis,92,y,896,36,4)+16;
    rounded(ctx,82,y,916,190,24,'#f7efce',null);ctx.fillStyle=ink;ctx.font='800 24px system-ui, sans-serif';ctx.fillText('牛马国际评级委员会鉴定',116,y+42);ctx.font='650 23px system-ui, sans-serif';wrap(ctx,verdict,116,y+80,848,33,3);y+=220;
    const footerY=y+42;ctx.fillStyle=ink;ctx.font='850 25px system-ui, sans-serif';ctx.fillText('看看你是牛来还是牛马',92,footerY+42);ctx.font='650 22px system-ui, sans-serif';ctx.fillText(pageUrl,92,footerY+80);if(qr){rounded(ctx,824,footerY,164,164,18,'#fff',null);ctx.drawImage(qr,836,footerY+12,140,140)}
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=Math.ceil(footerY+206);const output=canvas.getContext('2d');output.fillStyle=paper;output.fillRect(0,0,canvas.width,canvas.height);rounded(output,42,42,996,canvas.height-84,42,'#fffdf6');output.drawImage(content,0,0);
    return new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.92));
  }
  async function shareCard(){const button=document.getElementById('share');if(button){button.disabled=true;button.textContent='正在生成长图…'}try{const blob=await makeCard();if(!blob)return;const file=new File([blob],'我的牛马鉴定长图.jpg',{type:'image/jpeg'});if(navigator.canShare?.({files:[file]})&&navigator.share){try{await navigator.share({files:[file],title:'我的牛马鉴定',text:'你是哪一种打工牛马？'});return}catch(e){if(e?.name==='AbortError')return}}const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1500)}finally{if(button){button.disabled=false;button.textContent='分享结果长图'}}}
  async function shareLink(){const text='我刚做完牛马人格鉴定。你是哪一种打工牛马？';if(navigator.share){try{await navigator.share({title:'你是哪一种打工牛马？',text,url:pageUrl});return}catch(e){if(e?.name==='AbortError')return}}try{await navigator.clipboard.writeText(pageUrl);alert('测试网址已复制，可以直接发给朋友。')}catch(e){prompt('复制测试网址：',pageUrl)}}
  function ensureCreatorBox(result,shareBox){
    let box=result.querySelector('.xhsbox');
    if(box)return box;
    box=document.createElement('section');
    box.className='xhsbox';
    box.style.cssText='margin-top:18px;border:2px solid #25211d;border-radius:18px;padding:15px;background:#fff0f5;';
    box.innerHTML='<div class="section-kicker">找到作者</div><div style="font-size:20px;font-weight:1000;margin-bottom:7px">小红书找我</div><div style="font-size:14px;line-height:1.75;font-weight:750;margin-bottom:12px">想看更多测试、护肤内容，或者来找我聊聊。</div><a class="secondary friend" href="'+xhsUrl+'" target="_blank" rel="noopener noreferrer" style="display:block">去小红书看看 →</a>';
    shareBox.after(box);
    return box;
  }
  function ensureUtilityRow(result,creatorBox,skinBox){
    let row=result.querySelector('.result-utility-row');
    if(!row){row=document.createElement('div');row.className='result-utility-row';row.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px;align-items:stretch;';creatorBox.after(row)}
    if(skinBox){skinBox.style.marginTop='0';skinBox.style.height='100%';row.appendChild(skinBox)}
    return row;
  }
  function enhance(){const result=document.getElementById('result');if(!result?.classList.contains('show'))return;const shareBox=result.querySelector('.sharebox'),skinBox=result.querySelector('.skinbox');if(!shareBox)return;const creatorBox=ensureCreatorBox(result,shareBox);const row=ensureUtilityRow(result,creatorBox,skinBox);let qrBox=result.querySelector('.qrbox');if(!qrBox){qrBox=document.createElement('section');qrBox.className='qrbox';qrBox.innerHTML='<div><div class="section-kicker">扫码测试</div><div class="qr-title">看看朋友是牛来还是牛马</div><div class="qr-copy">长按保存或扫码进入测试</div></div><img src="images/test-qr.png" alt="牛马人格测试网址二维码" width="600" height="600">'}qrBox.style.marginTop='0';qrBox.style.height='100%';if(qrBox.parentElement!==row)row.prepend(qrBox);const imageButton=document.getElementById('share'),linkButton=document.getElementById('friend');if(imageButton&&!imageButton.dataset.longCard){imageButton.dataset.longCard='1';imageButton.textContent='分享结果长图';imageButton.onclick=shareCard}if(linkButton&&!linkButton.dataset.directLink){linkButton.dataset.directLink='1';linkButton.textContent='分享测试网址';linkButton.onclick=shareLink}}
  new MutationObserver(enhance).observe(document.body,{subtree:true,attributes:true,childList:true});enhance();
})();

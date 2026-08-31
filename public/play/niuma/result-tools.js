(()=>{
  const ink='#25211d',paper='#fff8e8',pink='#f5a6bd',yellow='#ffd873';
  const pageUrl='https://peacedskin.com/play/niuma/';
  function wrap(ctx,text,x,y,maxWidth,lineHeight,maxLines=20){const lines=[];for(const paragraph of String(text||'').split('\n')){if(!paragraph){lines.push('');continue}let line='';for(const ch of [...paragraph]){const test=line+ch;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=ch}else line=test}if(line)lines.push(line)}const visible=lines.slice(0,maxLines);visible.forEach((line,index)=>ctx.fillText(line,x,y+index*lineHeight));return y+visible.length*lineHeight}
  function rounded(ctx,x,y,w,h,r,fill,stroke=ink){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=4;ctx.stroke()}}
  function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src})}
  async function makeCard(){
    const code=document.querySelector('.code')?.textContent?.trim()||'NIUMA';
    const name=document.querySelector('.subtitle')?.textContent?.trim()||'打工牛马';
    const punch=document.querySelector('.punch')?.innerText?.trim()||'';
    const diagnosis=document.querySelector('.diag')?.innerText?.trim()||'';
    const verdict=document.querySelector('.verdict')?.innerText?.replace('牛马国际评级委员会鉴定：','').trim()||'';
    const artSrc=document.querySelector('.personality-art img')?.getAttribute('src');let art=null;
    if(artSrc){try{art=await loadImage(new URL(artSrc,location.href).href)}catch(e){art=null}}
    const artHeight=art?Math.round(760*art.naturalHeight/art.naturalWidth):0;
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1550+artHeight;const ctx=canvas.getContext('2d');ctx.fillStyle=paper;ctx.fillRect(0,0,canvas.width,canvas.height);rounded(ctx,50,50,980,canvas.height-100,42,'#fffdf6');
    let y=120;ctx.fillStyle=ink;ctx.font='800 32px system-ui, sans-serif';ctx.fillText('牛马国际评级委员会',100,y);
    y+=145;ctx.fillStyle=pink;ctx.font='950 124px system-ui, sans-serif';ctx.fillText(code,100,y);
    y+=80;ctx.fillStyle=ink;ctx.font='900 52px system-ui, sans-serif';y=wrap(ctx,name,100,y,880,64,2)+25;
    if(art){const w=760,h=artHeight;rounded(ctx,160,y,w,h,28,'#f7efce');ctx.save();ctx.beginPath();ctx.roundRect(160,y,w,h,26);ctx.clip();ctx.drawImage(art,160,y,w,h);ctx.restore();y+=h+45}
    ctx.font='850 35px system-ui, sans-serif';const punchHeight=Math.max(150,Math.ceil(ctx.measureText(punch).width/790)*50+70);rounded(ctx,90,y,900,punchHeight,28,'#ffdce7');y=wrap(ctx,punch,130,y+55,820,50,4)+45;
    ctx.fillStyle=ink;ctx.font='650 30px system-ui, sans-serif';y=wrap(ctx,diagnosis,100,y,880,45,8)+24;
    const verdictHeight=Math.max(180,Math.ceil(verdict.length/25)*44+85);rounded(ctx,90,y,900,verdictHeight,25,'#f7efce',null);ctx.font='800 29px system-ui, sans-serif';ctx.fillText('牛马国际评级委员会鉴定',125,y+52);ctx.font='650 28px system-ui, sans-serif';y=wrap(ctx,verdict,125,y+100,820,43,7)+35;
    ctx.fillStyle=ink;ctx.font='850 29px system-ui, sans-serif';ctx.fillText('你是哪一种打工牛马？',100,y);ctx.font='650 25px system-ui, sans-serif';ctx.fillText(pageUrl,100,y+48);ctx.font='550 21px system-ui, sans-serif';ctx.fillStyle='#7b746b';ctx.fillText('长按识别或点击分享链接，邀请同事接受物种鉴定。',100,y+90);
    return new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.92));
  }
  async function shareCard(){const button=document.getElementById('share');if(button){button.disabled=true;button.textContent='正在生成长图…'}try{const blob=await makeCard();if(!blob)return;const file=new File([blob],'我的牛马鉴定长图.jpg',{type:'image/jpeg'});if(navigator.canShare?.({files:[file]})&&navigator.share){try{await navigator.share({files:[file],title:'我的牛马鉴定',text:'你是哪一种打工牛马？'});return}catch(e){if(e?.name==='AbortError')return}}const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1500)}finally{if(button){button.disabled=false;button.textContent='分享结果长图'}}}
  async function shareLink(){const text='我刚做完牛马人格鉴定。你是哪一种打工牛马？';if(navigator.share){try{await navigator.share({title:'你是哪一种打工牛马？',text,url:pageUrl});return}catch(e){if(e?.name==='AbortError')return}}try{await navigator.clipboard.writeText(pageUrl);alert('测试网址已复制，可以直接发给朋友。')}catch(e){prompt('复制测试网址：',pageUrl)}}
  function enhance(){const result=document.getElementById('result');if(!result?.classList.contains('show'))return;const imageButton=document.getElementById('share'),linkButton=document.getElementById('friend');if(imageButton&&!imageButton.dataset.longCard){imageButton.dataset.longCard='1';imageButton.textContent='分享结果长图';imageButton.onclick=shareCard}if(linkButton&&!linkButton.dataset.directLink){linkButton.dataset.directLink='1';linkButton.textContent='分享测试网址';linkButton.onclick=shareLink}}
  new MutationObserver(enhance).observe(document.body,{subtree:true,attributes:true,childList:true});enhance();
})();

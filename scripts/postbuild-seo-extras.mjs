import fs from "node:fs/promises";
import path from "node:path";

const SITE_URL=(process.env.SITE_URL||"https://peacedskin.com").replace(/\/$/,"");
const DIST=path.resolve("dist");

async function enhanceSitemap(){
  const file=path.join(DIST,"sitemap.xml");
  let xml=await fs.readFile(file,"utf8");
  const play=`${SITE_URL}/play/niuma/`;
  if(!xml.includes(play)) xml=xml.replace("</urlset>",`  <url><loc>${play}</loc></url>\n</urlset>`);
  await fs.writeFile(file,xml,"utf8");
}

async function enhanceProducts(){
  const root=path.join(DIST,"product");
  let dirs=[];
  try{dirs=await fs.readdir(root,{withFileTypes:true})}catch{return}
  for(const dir of dirs){
    if(!dir.isDirectory())continue;
    const file=path.join(root,dir.name,"index.html");
    let html=await fs.readFile(file,"utf8");
    const h1=(html.match(/<h1>(.*?)<\/h1>/s)?.[1]||"").replace(/<[^>]+>/g,"");
    if(!html.includes('name="content-language"'))html=html.replace("<meta charset=\"utf-8\" />",'<meta charset="utf-8" />\n  <meta name="content-language" content="zh-CN,en" />');
    if(!html.includes("中文配方速览")){
      const zh=`\n  <section lang="zh-CN">\n    <h2>中文配方速览</h2>\n    <p><strong>${h1}</strong> 的本页信息来自 PEACED SKIN 已审核公开产品库。成分表、品类与配方完整度用于帮助用户和 AI 搜索系统理解产品本身，不等同于品牌宣传，也不代表每个人的实际使用结果。</p>\n    <p>查看时请同时考虑肤质、敏感程度、所在气候、护肤步骤以及不同市场或改版造成的配方差异。</p>\n  </section>\n`;
      html=html.replace("</main>",`${zh}</main>`);
    }
    html=html.replace(/<title>(.*?)<\/title>/,(_,title)=>`<title>${title.replace(" | PEACED SKIN","｜成分表与配方分析 | PEACED SKIN")}</title>`);
    await fs.writeFile(file,html,"utf8");
  }
}

await enhanceSitemap();
await enhanceProducts();
console.log("Applied bilingual SEO enhancements and static play sitemap entry.");

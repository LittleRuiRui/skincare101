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

await enhanceSitemap();
console.log("Added static play sitemap entry.");

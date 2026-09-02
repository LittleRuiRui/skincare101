export const origin = (process.env.SITE_URL || 'https://peacedskin.com').replace(/\/$/, '');
export const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export const productRoute = (slug,en=false) => `${en?'':'/zh'}/product/${slug}/`;
export const blogRoute = (slug='',en=false) => `${en?'/en':''}/blog/${slug?slug+'/':''}`;
export const directoryRoute = en => en?'/en/products/':'/products/';
export function locale(en,zhRoute,enRoute) {
  let n=0;
  const pick=(zh,english)=>en?english:zh;
  return {pick,
    text:(zh,english,tag='span')=>`<${tag} data-pair="p${n++}" lang="${en?'en':'zh-CN'}">${esc(pick(zh,english))}</${tag}>`,
    head:`<link rel="canonical" href="${origin}${en?enRoute:zhRoute}"><link rel="alternate" hreflang="zh-Hans" href="${origin}${zhRoute}"><link rel="alternate" hreflang="en" href="${origin}${enRoute}"><link rel="stylesheet" href="/reading.css"><script src="/reading.js" defer></script>`,
    controls:`<nav class="reading-controls" aria-label="${pick('阅读语言','Reading language')}"><a href="${zhRoute}" lang="zh-CN"${en?'':' aria-current="page"'}>中文</a><a href="${enRoute}" lang="en"${en?' aria-current="page"':''}>English</a><button type="button" id="compare-language" hidden aria-pressed="false" data-alternate="${en?zhRoute:enRoute}" data-show="${pick('中英对照','Chinese + English')}" data-hide="${pick('仅中文','English only')}" data-error="${pick('对照暂未加载，请用语言链接打开另一版。','Translation could not load. Please use the language links above.')}">${pick('中英对照','Chinese + English')}</button><span id="reading-status" role="status"></span></nav>`
  };
}

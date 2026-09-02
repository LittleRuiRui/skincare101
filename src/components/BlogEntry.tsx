import React from "react";
import { useLanguage } from "../lib/i18n";

export default function BlogEntry() {
  const { t, language } = useLanguage();
  return <section style={{marginTop:24,border:"1px solid #D9D0BC",borderRadius:22,overflow:"hidden",background:"#FBF6EA"}}>
    <a href={language === "en" ? "/en/blog/" : "/blog/"} style={{display:"block",textDecoration:"none",color:"#263027"}}>
      <img src="/illustrations/blog/singapore-climate.webp" width={1536} height={1024} loading="lazy" decoding="async" alt={t("热带城市日常护肤手绘插画","Illustrated skincare in a tropical city")} style={{display:"block",width:"100%",height:"auto",aspectRatio:"3/2",objectFit:"cover"}}/>
      <div style={{padding:20}}>
        <div style={{fontSize:14,color:"#2F5A40"}}>{t("护肤指南","Skincare journal")}</div>
        <h2 style={{fontSize:23,lineHeight:1.4,margin:"8px 0"}}>{t("少一点猜测，多一点适合自己","Less guessing. Better-fitting skincare.")}</h2>
        <p style={{fontSize:16,lineHeight:1.65,margin:"0 0 14px"}}>{t("12 篇完整指南：湿热天气、防晒、成分和产品选择，附资料来源，支持中英对照。","12 practical guides on humid weather, sunscreen, ingredients and product choices, with sources and English–Chinese reading.")}</p>
        <span style={{fontSize:15,fontWeight:600,color:"#2F5A40"}}>{t("阅读全部指南 →","Read the guides →")}</span>
      </div>
    </a>
  </section>;
}

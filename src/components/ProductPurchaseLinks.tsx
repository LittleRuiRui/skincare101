import React, { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { loadProductPurchaseLinks, type ProductPurchaseLink } from "../lib/purchaseLinks";

const INK = "#211F1B";
const LINE = "#DDD6CA";
const SAGE = "#718276";
const MUTE = "#777065";

export default function ProductPurchaseLinks({ productId, market }: { productId: string; market?: string }) {
  const [links, setLinks] = useState<ProductPurchaseLink[]>([]);

  useEffect(() => {
    let active = true;
    loadProductPurchaseLinks(productId, market).then((rows) => {
      if (active) setLinks(rows);
    }).catch(() => {
      if (active) setLinks([]);
    });
    return () => { active = false; };
  }, [productId, market]);

  if (!links.length) return null;

  return (
    <section style={{ border: `1px solid ${LINE}`, borderRadius: 17, padding: 17, background: "rgba(255,255,255,.68)", marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: SAGE, letterSpacing: ".08em", marginBottom: 5 }}>WHERE TO BUY</div>
      <div style={{ fontSize: 10.5, color: MUTE, lineHeight: 1.55, marginBottom: 10 }}>
        购买入口不会影响 Match 星级、推荐排序或产品分析。部分链接可能为联盟链接，我们可能获得佣金，但不会增加你的购买价格。
      </div>
      {links.map((link) => (
        <a key={link.id} href={link.url} target="_blank" rel="noreferrer sponsored" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid ${LINE}`, color: INK, textDecoration: "none", fontSize: 11.5 }}>
          <span>
            {link.retailerLocalName || link.retailer}
            {link.isOfficialStore ? " · 官方旗舰店" : ""}
            {link.isAffiliate ? " · Affiliate" : ""}
          </span>
          <ExternalLink size={13} />
        </a>
      ))}
    </section>
  );
}

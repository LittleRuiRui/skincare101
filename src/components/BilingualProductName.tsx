import React from "react";
import type { SharedProductRecord } from "../lib/supabase";
import { useLanguage } from "../lib/i18n";
import { brandNames, productNames } from "../lib/productNames";

export default function BilingualProductName({ product, compact = false }: { product: SharedProductRecord; compact?: boolean }) {
  const { language } = useLanguage();
  const brand = brandNames(product, language);
  const name = productNames(product, language);
  return (
    <div>
      <div style={{ fontSize: compact ? 10.5 : 11, color: "#777870", marginBottom: 4, lineHeight: 1.4 }}>
        {brand.primary}{brand.secondary ? <span style={{ color: "#9A9A94" }}> · {brand.secondary}</span> : null}
      </div>
      <div style={{ fontSize: compact ? 13 : 15, fontWeight: 650, lineHeight: 1.45, color: "#252724" }}>{name.primary}</div>
      {name.secondary ? <div style={{ fontSize: compact ? 10.5 : 11, color: "#8C8C85", lineHeight: 1.45, marginTop: 3 }}>{name.secondary}</div> : null}
    </div>
  );
}

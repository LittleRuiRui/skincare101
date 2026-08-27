import { supabase } from "./supabase";

export interface ProductPurchaseLink {
  id: string;
  productId: string;
  market: string;
  retailer: string;
  retailerLocalName?: string;
  url: string;
  isAffiliate: boolean;
  isOfficialStore: boolean;
  affiliateProvider?: string;
  lastVerifiedAt?: string;
}

export async function loadProductPurchaseLinks(productId: string, preferredMarket?: string): Promise<ProductPurchaseLink[]> {
  const id = productId.replace(/^shared-/, "");
  const { data, error } = await supabase
    .from("product_purchase_links")
    .select("id,product_id,market,retailer,retailer_local_name,canonical_url,affiliate_url,affiliate_provider,is_affiliate,is_official_store,last_verified_at")
    .eq("product_id", id)
    .eq("active", true);

  if (error) throw error;

  return (data || [])
    .map((row) => ({
      id: row.id,
      productId: row.product_id,
      market: row.market,
      retailer: row.retailer,
      retailerLocalName: row.retailer_local_name || undefined,
      url: row.affiliate_url || row.canonical_url,
      isAffiliate: Boolean(row.is_affiliate && row.affiliate_url),
      isOfficialStore: Boolean(row.is_official_store),
      affiliateProvider: row.affiliate_provider || undefined,
      lastVerifiedAt: row.last_verified_at || undefined,
    }))
    .filter((row) => Boolean(row.url))
    .sort((a, b) => {
      const marketA = preferredMarket && a.market === preferredMarket ? 1 : 0;
      const marketB = preferredMarket && b.market === preferredMarket ? 1 : 0;
      if (marketA !== marketB) return marketB - marketA;
      if (a.isOfficialStore !== b.isOfficialStore) return Number(b.isOfficialStore) - Number(a.isOfficialStore);
      return a.retailer.localeCompare(b.retailer);
    });
}

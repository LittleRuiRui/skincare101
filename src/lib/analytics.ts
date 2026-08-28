import { supabase } from "./supabase";
import type { AppLanguage } from "./i18n";

const SESSION_KEY = "skincare101-analytics-session";
let demographicCache: { gender?: string; ageRange?: string } | null = null;

function sessionId() {
  if (typeof window === "undefined") return "server";
  let value = window.sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

async function demographics() {
  if (demographicCache) return demographicCache;
  demographicCache = {};
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return demographicCache;
    const { data } = await supabase.from("skin_profiles").select("profile_answers").eq("user_id", auth.user.id).eq("is_active", true).limit(1).maybeSingle();
    const answers = (data?.profile_answers || {}) as Record<string, unknown>;
    const gender = String(answers.gender || answers.sex || answers.biologicalSex || "").trim();
    const ageRange = String(answers.ageRange || answers.age_range || answers.age || "").trim();
    demographicCache = { gender: gender || undefined, ageRange: ageRange || undefined };
  } catch { /* analytics must never block the product */ }
  return demographicCache;
}

export async function trackEvent(eventName: string, options: {
  pageName?: string;
  productId?: string;
  searchQuery?: string;
  searchResultCount?: number;
  language?: AppLanguage;
  metadata?: Record<string, unknown>;
} = {}) {
  try {
    const [{ data: auth }, demo] = await Promise.all([supabase.auth.getUser(), demographics()]);
    const rawId = options.productId?.replace(/^shared-/, "");
    const productId = rawId && /^[0-9a-f-]{36}$/i.test(rawId) ? rawId : null;
    await supabase.from("analytics_events").insert({
      user_id: auth.user?.id || null,
      session_id: sessionId(),
      event_name: eventName,
      page_name: options.pageName || null,
      product_id: productId,
      search_query: options.searchQuery?.trim().slice(0, 160) || null,
      search_result_count: Number.isFinite(options.searchResultCount) ? options.searchResultCount : null,
      language: options.language || null,
      gender: demo.gender || null,
      age_range: demo.ageRange || null,
      metadata: options.metadata || {}
    });
  } catch { /* fire-and-forget */ }
}

export function trackEventLater(eventName: string, options: Parameters<typeof trackEvent>[1] = {}) {
  void trackEvent(eventName, options);
}

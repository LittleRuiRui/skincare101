import { createClient, type Session } from "@supabase/supabase-js";
import type { FormulaDna } from "../intelligence/formulaDna";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://tepiqcwytynhrjhtvnws.supabase.co";
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_J9GjGc-hNTEvpl-MTyRAiw__JuISs-T";

// Publishable keys are designed for browser use. Authorization is enforced by RLS.
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface SharedProductRecord {
  id: string;
  brand: string;
  name: string;
  brandLocalName?: string;
  brandEnglishName?: string;
  productLocalName?: string;
  productEnglishName?: string;
  sourceLocale?: string;
  category: string;
  ingredients: string[];
  ingredientListType: "full" | "partial";
  dataCompleteness: number;
  sourceUrl: string;
  verifiedAt: string;
  formulaDna?: FormulaDna;
  popularityRank?: number;
  popularityBasis?: string;
  popularitySources?: string[];
  popularityTier?: "multi-source-popular" | "retailer-bestseller" | "open-data-popular";
  asiaAvailabilityStatus?: "cross_border_verified" | "unverified";
  qualityFlags?: string[];
  source: "shared";
}

export interface ProductDetailRecord extends SharedProductRecord {
  market: string;
  formulaId: string;
  fullIngredients: string[];
}

export interface ParsedSubmission {
  recognized: Array<{ canonicalName: string }>;
  unknown: Array<{ raw: string }>;
  coverage: number;
}

export interface PublicProductExperience {
  id: string;
  productKey: string;
  skinType: string;
  sensitivity: string;
  concerns: string[];
  reaction: "better" | "neutral" | "irritated";
  texture: "love" | "okay" | "dislike";
  repurchase: "yes" | "maybe" | "no";
  note: string;
  updatedAt: string;
}

export interface PublicProductExperienceInput {
  productKey: string;
  skinType: string;
  sensitivity: string;
  concerns: string[];
  reaction: PublicProductExperience["reaction"];
  texture: PublicProductExperience["texture"];
  repurchase: PublicProductExperience["repurchase"];
  note: string;
}

export async function loadPublicProductExperiences(productKey: string): Promise<PublicProductExperience[]> {
  const { data, error } = await supabase
    .from("product_experiences")
    .select("id,product_key,skin_type,sensitivity,concerns,reaction,texture,repurchase,note,updated_at")
    .eq("product_key", productKey)
    .order("updated_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    productKey: row.product_key,
    skinType: row.skin_type,
    sensitivity: row.sensitivity,
    concerns: row.concerns || [],
    reaction: row.reaction,
    texture: row.texture,
    repurchase: row.repurchase,
    note: row.note || "",
    updatedAt: row.updated_at,
  }));
}

export async function savePublicProductExperience(input: PublicProductExperienceInput): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("请先登录，再公开提交使用体验。");
  const { error } = await supabase.from("product_experiences").upsert({
    user_id: userData.user.id,
    product_key: input.productKey,
    skin_type: input.skinType,
    sensitivity: input.sensitivity,
    concerns: input.concerns.slice(0, 8),
    reaction: input.reaction,
    texture: input.texture,
    repurchase: input.repurchase,
    note: input.note.trim().slice(0, 500),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,product_key" });
  if (error) throw error;
}

export async function loadSharedProductCatalog(): Promise<SharedProductRecord[]> {
  const { data, error } = await supabase
    .from("approved_product_catalog_summary")
    .select("id,brand,name,brand_local_name,brand_english_name,product_local_name,product_english_name,source_locale,category,ingredient_names,ingredient_list_type,data_completeness,source_url,popularity_sources,popularity_tier,asia_availability_status")
    // V3 is a decision tool, so its public catalog only surfaces products whose
    // complete ingredient list is stored. Partial candidates remain in the
    // database for review and are still available to the legacy fallback.
    .eq("ingredient_list_type", "full")
    .order("brand", { ascending: true });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: `shared-${row.id}`,
    brand: row.brand || "未知品牌",
    name: row.name || "未命名产品",
    brandLocalName: row.brand_local_name || undefined,
    brandEnglishName: row.brand_english_name || undefined,
    productLocalName: row.product_local_name || undefined,
    productEnglishName: row.product_english_name || undefined,
    sourceLocale: row.source_locale || undefined,
    category: row.category || "其他",
    ingredients: row.ingredient_names || [],
    ingredientListType: row.ingredient_list_type === "full" ? "full" : "partial",
    dataCompleteness: row.data_completeness || 0,
    sourceUrl: row.source_url || "https://tepiqcwytynhrjhtvnws.supabase.co",
    verifiedAt: "",
    popularitySources: row.popularity_sources || [],
    popularityTier: row.popularity_tier || undefined,
    asiaAvailabilityStatus: row.asia_availability_status || "unverified",
    qualityFlags: [],
    source: "shared",
  }));
}

export async function loadProductDetail(productId: string): Promise<ProductDetailRecord> {
  const id = productId.replace(/^shared-/, "");
  const { data, error } = await supabase
    .from("approved_product_catalog")
    .select("id,brand,name,brand_local_name,brand_english_name,product_local_name,product_english_name,source_locale,category,market,source_url,formula_id,ingredient_names,ingredient_list_type,data_completeness,verified_at")
    .eq("id", id)
    .limit(1)
    .single();

  if (error) throw error;
  return {
    id: `shared-${data.id}`,
    brand: data.brand || "未知品牌",
    name: data.name || "未命名产品",
    brandLocalName: data.brand_local_name || undefined,
    brandEnglishName: data.brand_english_name || undefined,
    productLocalName: data.product_local_name || undefined,
    productEnglishName: data.product_english_name || undefined,
    sourceLocale: data.source_locale || undefined,
    category: data.category || "其他",
    market: data.market || "global",
    formulaId: data.formula_id || "",
    ingredients: (data.ingredient_names || []).slice(0, 15),
    fullIngredients: data.ingredient_names || [],
    ingredientListType: data.ingredient_list_type === "full" ? "full" : "partial",
    dataCompleteness: data.data_completeness || 0,
    sourceUrl: data.source_url || "https://tepiqcwytynhrjhtvnws.supabase.co",
    verifiedAt: data.verified_at || "",
    source: "shared",
  };
}

export async function sendSignInLink(email: string): Promise<void> {
  const redirectUrl = window.location.hostname === "localhost"
    ? `${window.location.origin}${import.meta.env.BASE_URL}`
    : "https://littleruirui.github.io/skincare101/?auth=callback";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectUrl },
  });
  if (error) throw error;
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithPassword(email: string, password: string): Promise<void> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.session) {
    throw new Error("账号已创建，但数据库仍要求邮件确认。请关闭 Supabase Auth 的 Confirm email 后再注册。");
  }
}

export async function currentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export interface SkinProfileInput {
  skinAnswers: Record<string, string>;
  profileAnswers: Record<string, string>;
  selectedSymptoms: string[];
  symptomAnswers: Record<string, Record<string, string>>;
  multiSelectAnswers: Record<string, Record<string, string[]>>;
  redFlag: string | null;
}

export async function saveMySkinProfile(input: SkinProfileInput, name = "我的肤质档案"): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("请先登录再保存皮肤档案。");

  const { error: clearError } = await supabase
    .from("skin_profiles")
    .update({ is_active: false })
    .eq("user_id", userData.user.id)
    .eq("is_active", true);
  if (clearError) throw clearError;

  const { error } = await supabase
    .from("skin_profiles")
    .insert({
      user_id: userData.user.id,
      name: name.trim() || "我的肤质档案",
      is_active: true,
      skin_answers: input.skinAnswers,
      profile_answers: input.profileAnswers,
      selected_symptoms: input.selectedSymptoms,
      symptom_answers: input.symptomAnswers,
      multi_select_answers: input.multiSelectAnswers,
      red_flag: input.redFlag,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

export interface ProductSubmissionInput {
  brand: string;
  productName: string;
  category: string;
  market: string;
  rawIngredients: string;
  parseResult: ParsedSubmission;
  ingredientsPhoto?: File | null;
}

export async function submitProductContribution(input: ProductSubmissionInput): Promise<string> {
  const session = await currentSession();
  if (!session?.user) throw new Error("请先登录再提交产品。");

  const recognized = input.parseResult.recognized.map((item) => item.canonicalName);
  const unknown = input.parseResult.unknown.map((item) => item.raw);
  if (!recognized.length) throw new Error("至少需要识别并确认一个标准成分。");

  const { data: draft, error: draftError } = await supabase
    .from("product_submissions")
    .insert({
      brand: input.brand.trim(),
      product_name: input.productName.trim(),
      category: input.category,
      market: input.market,
      raw_ingredients: input.rawIngredients.trim(),
      parsed_ingredients: recognized,
      unknown_ingredients: unknown,
      data_completeness: input.parseResult.coverage,
      status: "draft",
    })
    .select("id")
    .single();

  if (draftError || !draft) throw draftError || new Error("无法建立投稿草稿。");

  if (input.ingredientsPhoto) {
    const extension = input.ingredientsPhoto.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `${session.user.id}/${draft.id}/ingredients.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("product-submissions")
      .upload(storagePath, input.ingredientsPhoto, {
        cacheControl: "3600",
        contentType: input.ingredientsPhoto.type || "image/jpeg",
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { error: imageRowError } = await supabase.from("submission_images").insert({
      submission_id: draft.id,
      kind: "ingredients",
      storage_path: storagePath,
    });
    if (imageRowError) {
      await supabase.storage.from("product-submissions").remove([storagePath]);
      throw imageRowError;
    }
  }

  const { error: submitError } = await supabase
    .from("product_submissions")
    .update({ status: "pending", submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", draft.id);
  if (submitError) throw submitError;

  return draft.id;
}

export async function loadMySubmissions() {
  const { data, error } = await supabase
    .from("product_submissions")
    .select("id,brand,product_name,status,rejection_reason,created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return data || [];
}

export async function loadPendingReviewQueue() {
  const { data, error } = await supabase
    .from("product_submissions")
    .select("id,brand,product_name,category,market,raw_ingredients,parsed_ingredients,unknown_ingredients,data_completeness,status,created_at,submission_images(storage_path,kind)")
    .in("status", ["pending", "reviewing"])
    .order("created_at", { ascending: true });
  if (error) throw error;

  return Promise.all((data || []).map(async (submission: any) => {
    const image = submission.submission_images?.find((item: any) => item.kind === "ingredients");
    if (!image) return { ...submission, imageUrl: null };
    const { data: signed } = await supabase.storage
      .from("product-submissions")
      .createSignedUrl(image.storage_path, 900);
    return { ...submission, imageUrl: signed?.signedUrl || null };
  }));
}

export async function approveSubmission(id: string, sourceUrl?: string): Promise<void> {
  const { error } = await supabase.rpc("approve_product_submission", {
    p_submission_id: id,
    p_source_url: sourceUrl || null,
  });
  if (error) throw error;
}

export async function rejectSubmission(id: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc("reject_product_submission", {
    p_submission_id: id,
    p_reason: reason,
  });
  if (error) throw error;
}


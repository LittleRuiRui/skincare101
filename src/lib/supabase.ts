import { createClient, type Session } from "@supabase/supabase-js";

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
  category: string;
  ingredients: string[];
  ingredientListType: "full" | "partial";
  dataCompleteness: number;
  sourceUrl: string;
  verifiedAt: string;
  source: "shared";
}

export interface ParsedSubmission {
  recognized: Array<{ canonicalName: string }>;
  unknown: Array<{ raw: string }>;
  coverage: number;
}

export async function loadSharedProductCatalog(): Promise<SharedProductRecord[]> {
  const { data, error } = await supabase
    .from("approved_product_catalog")
    .select("id,brand,name,category,ingredient_names,ingredient_list_type,data_completeness,source_url,verified_at")
    .order("brand", { ascending: true });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: `shared-${row.id}`,
    brand: row.brand || "未知品牌",
    name: row.name || "未命名产品",
    category: row.category || "其他",
    ingredients: row.ingredient_names || [],
    ingredientListType: row.ingredient_list_type === "full" ? "full" : "partial",
    dataCompleteness: row.data_completeness || 0,
    sourceUrl: row.source_url || "https://tepiqcwytynhrjhtvnws.supabase.co",
    verifiedAt: row.verified_at || "",
    source: "shared",
  }));
}

export async function sendSignInLink(email: string): Promise<void> {
  const redirectUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectUrl },
  });
  if (error) throw error;
}

export async function currentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
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

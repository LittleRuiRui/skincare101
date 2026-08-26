import { currentSession, supabase } from "./supabase";
import type { SkinProfileRecord } from "./skinProfile";

const PROFILE_COLUMNS = "id,name,is_active,skin_answers,profile_answers,selected_symptoms,symptom_answers,multi_select_answers,red_flag,updated_at";

function mapProfile(data: any): SkinProfileRecord {
  return {
    id: data.id,
    name: data.name || "我的肤质档案",
    isActive: Boolean(data.is_active),
    skinAnswers: data.skin_answers || {},
    profileAnswers: data.profile_answers || {},
    selectedSymptoms: data.selected_symptoms || [],
    symptomAnswers: data.symptom_answers || {},
    multiSelectAnswers: data.multi_select_answers || {},
    redFlag: data.red_flag || null,
    updatedAt: data.updated_at || undefined,
  };
}

export async function loadMySkinProfiles(): Promise<SkinProfileRecord[]> {
  const session = await currentSession();
  if (!session?.user) return [];

  const { data, error } = await supabase
    .from("skin_profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", session.user.id)
    .order("is_active", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapProfile);
}

export async function loadMySkinProfile(): Promise<SkinProfileRecord | null> {
  const profiles = await loadMySkinProfiles();
  return profiles.find((profile) => profile.isActive) || profiles[0] || null;
}

export async function setActiveSkinProfile(profileId: string): Promise<void> {
  const session = await currentSession();
  if (!session?.user) throw new Error("请先登录再切换档案。");
  const { error: clearError } = await supabase.from("skin_profiles").update({ is_active: false }).eq("user_id", session.user.id).eq("is_active", true);
  if (clearError) throw clearError;
  const { error } = await supabase.from("skin_profiles").update({ is_active: true }).eq("user_id", session.user.id).eq("id", profileId);
  if (error) throw error;
}


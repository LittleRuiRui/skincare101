import { currentSession, supabase } from "./supabase";
import type { SkinProfileRecord } from "./skinProfile";

const PROFILE_COLUMNS = "id,name,is_active,skin_answers,profile_answers,selected_symptoms,symptom_answers,multi_select_answers,red_flag,updated_at";
const LOCAL_PROFILES_KEY = "skincare101.local-skin-profiles.v1";

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

function readLocalProfiles(): SkinProfileRecord[] {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_PROFILES_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeLocalProfiles(profiles: SkinProfileRecord[]): void {
  localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
}

export function saveLocalSkinProfile(input: Omit<SkinProfileRecord, "id" | "name" | "isActive" | "updatedAt">, name = "我的肤质档案"): SkinProfileRecord {
  const profiles = readLocalProfiles();
  const normalizedName = name.trim() || "我的肤质档案";
  const existing = profiles.find((item) => item.name === normalizedName);
  const saved: SkinProfileRecord = {
    ...input,
    id: existing?.id || `local-${globalThis.crypto?.randomUUID?.() || Date.now()}`,
    name: normalizedName,
    isActive: true,
    updatedAt: new Date().toISOString(),
  };
  writeLocalProfiles([saved, ...profiles.filter((item) => item.id !== saved.id).map((item) => ({ ...item, isActive: false }))]);
  window.dispatchEvent(new CustomEvent("skincare101:profiles-changed"));
  return saved;
}

export async function loadMySkinProfiles(): Promise<SkinProfileRecord[]> {
  const localProfiles = readLocalProfiles();
  const session = await currentSession().catch(() => null);
  if (!session?.user) return localProfiles;

  const { data, error } = await supabase
    .from("skin_profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", session.user.id)
    .order("is_active", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) return localProfiles;
  const cloudProfiles = (data || []).map(mapProfile);
  const cloudIds = new Set(cloudProfiles.map((item) => item.id));
  const cloudNames = new Set(cloudProfiles.map((item) => item.name));
  return [...cloudProfiles, ...localProfiles.filter((item) => !cloudIds.has(item.id) && !cloudNames.has(item.name))];
}

export async function loadMySkinProfile(): Promise<SkinProfileRecord | null> {
  const profiles = await loadMySkinProfiles();
  return profiles.find((profile) => profile.isActive) || profiles[0] || null;
}

export async function setActiveSkinProfile(profileId: string): Promise<void> {
  const localProfiles = readLocalProfiles();
  if (localProfiles.some((item) => item.id === profileId)) {
    writeLocalProfiles(localProfiles.map((item) => ({ ...item, isActive: item.id === profileId })));
    window.dispatchEvent(new CustomEvent("skincare101:profiles-changed"));
    return;
  }
  const session = await currentSession();
  if (!session?.user) throw new Error("请先登录再切换档案。");
  const { error: clearError } = await supabase.from("skin_profiles").update({ is_active: false }).eq("user_id", session.user.id).eq("is_active", true);
  if (clearError) throw clearError;
  const { error } = await supabase.from("skin_profiles").update({ is_active: true }).eq("user_id", session.user.id).eq("id", profileId);
  if (error) throw error;
}


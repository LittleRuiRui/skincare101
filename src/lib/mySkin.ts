import { currentSession, supabase } from "./supabase";
import type { SkinProfileRecord } from "./skinProfile";

export async function loadMySkinProfile(): Promise<SkinProfileRecord | null> {
  const session = await currentSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from("skin_profiles")
    .select("skin_answers,profile_answers,selected_symptoms,symptom_answers,multi_select_answers,red_flag,updated_at")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    skinAnswers: data.skin_answers || {},
    profileAnswers: data.profile_answers || {},
    selectedSymptoms: data.selected_symptoms || [],
    symptomAnswers: data.symptom_answers || {},
    multiSelectAnswers: data.multi_select_answers || {},
    redFlag: data.red_flag || null,
    updatedAt: data.updated_at || undefined,
  };
}

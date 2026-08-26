import type { SkinProfileInput } from "./supabase";

const PENDING_PROFILE_KEY = "skincare101.pending-profile";
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export interface StoredProfileDraft {
  savedAt: number;
  profile: SkinProfileInput;
  name?: string;
}

export function savePendingProfileDraft(profile: SkinProfileInput, name = "我的肤质档案"): void {
  localStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify({
    savedAt: Date.now(),
    profile,
    name: name.trim() || "我的肤质档案",
  }));
}

export function loadPendingProfileDraftRecord(): StoredProfileDraft | null {
  try {
    const raw = localStorage.getItem(PENDING_PROFILE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredProfileDraft;
    if (!stored?.profile || !stored.savedAt || Date.now() - stored.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(PENDING_PROFILE_KEY);
      return null;
    }
    return stored;
  } catch {
    localStorage.removeItem(PENDING_PROFILE_KEY);
    return null;
  }
}

export function loadPendingProfileDraft(): SkinProfileInput | null {
  return loadPendingProfileDraftRecord()?.profile || null;
}

export function clearPendingProfileDraft(): void {
  localStorage.removeItem(PENDING_PROFILE_KEY);
}

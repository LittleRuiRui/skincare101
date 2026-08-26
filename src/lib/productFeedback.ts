export type ProductReaction = "better" | "neutral" | "irritated";

export interface ProductExperience {
  productId: string;
  reaction: ProductReaction;
  texture: "love" | "okay" | "dislike";
  repurchase: "yes" | "maybe" | "no";
  note: string;
  updatedAt: string;
}

const STORAGE_KEY = "skincare101.productExperiences.v1";

function readAll(): ProductExperience[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function loadProductExperience(productId: string) {
  return readAll().find((item) => item.productId === productId) || null;
}

export function saveProductExperience(experience: Omit<ProductExperience, "updatedAt">) {
  const next = readAll().filter((item) => item.productId !== experience.productId);
  next.unshift({ ...experience, updatedAt: new Date().toISOString() });
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 200)));
}

export function productExperienceAdjustment(productId: string) {
  const experience = loadProductExperience(productId);
  if (!experience) return 0;
  if (experience.reaction === "irritated") return -1000;
  let adjustment = experience.reaction === "better" ? 8 : 0;
  if (experience.texture === "love") adjustment += 3;
  if (experience.texture === "dislike") adjustment -= 5;
  if (experience.repurchase === "yes") adjustment += 3;
  if (experience.repurchase === "no") adjustment -= 4;
  return adjustment;
}

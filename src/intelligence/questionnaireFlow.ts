export const MAX_SELECTED_CONCERNS = 2;

export function toggleConcernSelection(current: string[], key: string): string[] {
  if (current.includes(key)) return current.filter((item) => item !== key);
  if (current.length >= MAX_SELECTED_CONCERNS) return current;
  return [...current, key];
}

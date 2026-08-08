export interface IngredientReference {
  name: string;
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s·•,，。;；:_+\-\/\\()（）.%]/g, "");

const EXTRA_ALIASES: Record<string, string[]> = {
  "水杨酸 (BHA)": ["Salicylic Acid", "BHA"],
  "果酸 (Glycolic/Lactic/Mandelic Acid)": ["Glycolic Acid", "Lactic Acid", "Mandelic Acid", "AHA"],
  "二氧化钛/氧化锌 (物理防晒剂)": ["Titanium Dioxide", "Zinc Oxide"],
  "阿伏苯宗/奥克立林等 (化学防晒剂)": ["Avobenzone", "Octocrylene", "Homosalate", "Octisalate"],
};

const referenceAliases = (reference: string) => {
  const aliases = [reference];
  const chinese = reference.split("(")[0];
  aliases.push(...chinese.split(/[\/、]/));

  for (const match of reference.matchAll(/\(([^)]+)\)/g)) {
    aliases.push(...match[1].split(/[\/,]|\bor\b|等/i));
  }

  aliases.push(...(EXTRA_ALIASES[reference] || []));

  return aliases
    .map((alias) => alias.trim())
    .filter((alias) => normalize(alias).length >= 4 || ["bha", "aha", "pha"].includes(normalize(alias)));
};

export function ingredientMatches(rawIngredient: string, referenceName: string) {
  const raw = normalize(rawIngredient);
  if (!raw) return false;
  return referenceAliases(referenceName).some((alias) => {
    const candidate = normalize(alias);
    return raw.includes(candidate) || candidate.includes(raw);
  });
}

export function parseIngredientText(
  text: string,
  library: IngredientReference[],
): string[] {
  const normalizedText = normalize(text);
  const matched = library
    .map((reference) => {
      const positions = referenceAliases(reference.name)
        .map((alias) => normalizedText.indexOf(normalize(alias)))
        .filter((position) => position >= 0);
      return {
        name: reference.name,
        position: positions.length > 0 ? Math.min(...positions) : -1,
      };
    })
    .filter((match) => match.position >= 0)
    .sort((a, b) => a.position - b.position);

  return matched.map((match) => match.name);
}

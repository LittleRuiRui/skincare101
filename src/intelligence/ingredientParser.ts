export interface IngredientReference {
  name: string;
}

export interface ParsedIngredientDetail {
  raw: string;
  canonicalName?: string;
  matchType: "exact" | "alias" | "fuzzy" | "unknown";
  confidence: number;
}

export interface IngredientParseResult {
  items: ParsedIngredientDetail[];
  recognized: ParsedIngredientDetail[];
  unknown: ParsedIngredientDetail[];
  coverage: number;
}

interface DirectMatch {
  reference: IngredientReference;
  position: number;
  exact: boolean;
}

interface FuzzyMatch {
  reference: IngredientReference;
  score: number;
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

const levenshtein = (a: string, b: string) => {
  const rows = Array.from({ length: a.length + 1 }, (_, index) => index);
  for (let column = 1; column <= b.length; column += 1) {
    let previous = rows[0];
    rows[0] = column;
    for (let row = 1; row <= a.length; row += 1) {
      const current = rows[row];
      rows[row] = Math.min(
        rows[row] + 1,
        rows[row - 1] + 1,
        previous + (a[row - 1] === b[column - 1] ? 0 : 1),
      );
      previous = current;
    }
  }
  return rows[a.length];
};

const similarity = (a: string, b: string) => {
  const longest = Math.max(a.length, b.length);
  return longest === 0 ? 1 : 1 - levenshtein(a, b) / longest;
};

const splitIngredientText = (text: string) =>
  text
    .replace(/\r/g, "\n")
    .split(/[\n,，;；•·]+/)
    .map((part) => part.replace(/^ingredients?\s*[:：]?/i, "").trim())
    .filter((part) => part.length > 1);

export function parseIngredientDetails(
  text: string,
  library: IngredientReference[],
): IngredientParseResult {
  const items: ParsedIngredientDetail[] = [];
  const seen = new Set<string>();

  splitIngredientText(text).forEach((raw) => {
    const rawNormalized = normalize(raw);
    const directMatches: DirectMatch[] = library
      .map((reference) => {
        const aliases = referenceAliases(reference.name);
        const positions = aliases
          .map((alias) => ({ alias, position: rawNormalized.indexOf(normalize(alias)) }))
          .filter((match) => match.position >= 0);
        if (positions.length === 0) return null;
        const first = positions.sort((a, b) => a.position - b.position)[0];
        const exact = normalize(reference.name) === rawNormalized || normalize(first.alias) === rawNormalized;
        return { reference, position: first.position, exact };
      })
      .filter((match): match is DirectMatch => match !== null)
      .sort((a, b) => a.position - b.position);

    if (directMatches.length > 0) {
      directMatches.forEach((match) => {
        if (seen.has(match.reference.name)) return;
        seen.add(match.reference.name);
        items.push({
          raw,
          canonicalName: match.reference.name,
          matchType: match.exact ? "exact" : "alias",
          confidence: match.exact ? 1 : 0.94,
        });
      });
      return;
    }

    let fuzzyMatch: FuzzyMatch | null = null;
    if (rawNormalized.length >= 7) {
      for (const reference of library) {
        for (const alias of referenceAliases(reference.name)) {
          const aliasNormalized = normalize(alias);
          if (aliasNormalized.length < 7) continue;
          const score = similarity(rawNormalized, aliasNormalized);
          if (score >= 0.82 && (!fuzzyMatch || score > fuzzyMatch.score)) {
            fuzzyMatch = { reference, score };
          }
        }
      }
    }

    if (fuzzyMatch && !seen.has(fuzzyMatch.reference.name)) {
      seen.add(fuzzyMatch.reference.name);
      items.push({
        raw,
        canonicalName: fuzzyMatch.reference.name,
        matchType: "fuzzy",
        confidence: Number(fuzzyMatch.score.toFixed(2)),
      });
      return;
    }

    items.push({ raw, matchType: "unknown", confidence: 0 });
  });

  const recognized = items.filter((item) => item.canonicalName);
  const unknown = items.filter((item) => !item.canonicalName);
  const coverage = items.length === 0 ? 0 : Math.round((recognized.length / items.length) * 100);
  return { items, recognized, unknown, coverage };
}

export function parseIngredientText(
  text: string,
  library: IngredientReference[],
): string[] {
  return parseIngredientDetails(text, library).recognized.map((item) => item.canonicalName!);
}

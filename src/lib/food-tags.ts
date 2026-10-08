export const MAX_FOOD_TAGS = 10;
const generic = new Set(["food", "meal", "plate", "dish", "dinner", "lunch", "breakfast", "snack", "healthy", "homemade", "delicious", "ingredients", "dessert", "entree", "sauce", "seasoning", "spices"]);
const canonical: Record<string, string> = {
  tomato: "tomatoes", onion: "onions", potato: "potatoes", mushroom: "mushrooms", egg: "eggs",
  "chicken breast": "chicken", "chicken breasts": "chicken", "chicken thighs": "chicken",
  strawberry: "strawberries", apple: "apples", grape: "grapes", carrot: "carrots",
  pea: "peas", "green bean": "green beans", "bell pepper": "bell peppers",
  "sweet potato": "sweet potatoes", "spring onions": "green onions", scallions: "green onions",
  "garbanzo beans": "chickpeas", "cherry tomatoes": "tomatoes",
};

export function hasFoodTags(tags: readonly string[] | null | undefined) {
  return !!tags?.some((tag) => tag.trim().length > 0);
}
export function normalizeFoodTags(tags: readonly string[]): string[] {
  const result = new Set<string>();
  for (const raw of tags) {
    let tag = raw.normalize("NFKC").toLowerCase().trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
    tag = tag.replace(/^(?:(?:grilled|roasted|steamed|fried|baked|sauteed)\s+)+/, "");
    tag = canonical[tag] ?? tag;
    if (!tag || generic.has(tag) || !/^[a-z]+(?: [a-z]+){0,3}$/.test(tag) || tag.length > 48 ||
      /\b(maybe|possibly|probably|likely|unknown|uncertain|perhaps)\b/.test(tag)) continue;
    result.add(tag);
    if (result.size === MAX_FOOD_TAGS) break;
  }
  return [...result];
}
export function parseIngredientTags(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > MAX_FOOD_TAGS ||
    value.some((tag) => typeof tag !== "string" || !tag.trim() || tag.length > 48 || !/^[a-zA-Z _-]+$/.test(tag))) {
    throw new Error("Invalid ingredient tag array.");
  }
  const tags = normalizeFoodTags(value);
  if (!tags.length) throw new Error("No clear ingredient tags were identified.");
  return tags;
}

/** Exact Postgres array comparison protects tags saved while analysis is running. */
export function postgresTagArray(tags: readonly string[]) {
  return `{${tags.map((tag) => '"' + tag.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"').join(",")}}`;
}

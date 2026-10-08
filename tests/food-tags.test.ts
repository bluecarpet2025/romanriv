import { expect, it } from "vitest";
import { hasFoodTags, normalizeFoodTags, parseIngredientTags, postgresTagArray } from "@/lib/food-tags";

it("normalizes ingredient wording, case, spacing, and duplicates", () => {
  expect(normalizeFoodTags([" TOMATO ", "tomatoes", " Chicken Breast", "roasted chicken", "GREEN-BEAN", "green beans", "egg", "strawberry"])).toEqual(["tomatoes", "chicken", "green beans", "eggs", "strawberries"]);
});
it("caps normalized tags at ten", () => {
  const tags = ["pasta", "tomatoes", "broccoli", "sausage", "salad", "onions", "cheese", "potatoes", "mushrooms", "chicken", "avocado", "eggs"];
  expect(normalizeFoodTags(tags)).toEqual(tags.slice(0, 10));
});
it("removes generic, uncertain and unsafe labels without inventing replacements", () => {
  expect(normalizeFoodTags(["food", "meal", "plate", "dinner", "breakfast", "dessert", "sauce", "maybe chicken", "unknown", "<script>", "", "pasta"])).toEqual(["pasta"]);
});
it.each([null, {}, "chicken", ["chicken", 1], [""], ["<script>"], ["food"], [], Array(11).fill("eggs")])("rejects invalid AI output %j", (value) => {
  expect(() => parseIngredientTags(value)).toThrow();
});
it("accepts a concise valid ingredient array", () => expect(parseIngredientTags(["Egg", "tomato"])).toEqual(["eggs", "tomatoes"]));
it("treats null/blank arrays as untagged, while respecting manual tags", () => {
  expect(hasFoodTags(null)).toBe(false); expect(hasFoodTags([" ", ""])).toBe(false); expect(hasFoodTags(["custom manual tag"])).toBe(true);
});
it("escapes Postgres array comparisons without changing manual labels", () => {
  expect(postgresTagArray([])).toBe("{}");
  expect(postgresTagArray(['a,b', 'quote"', 'slash\\'])).toBe('{"a,b","quote\\\"","slash\\\\"}');
});

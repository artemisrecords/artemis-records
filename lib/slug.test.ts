import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and dashes spaces", () => {
    expect(slugify("Nova Aeon")).toBe("nova-aeon");
  });
  it("strips accents", () => {
    expect(slugify("Caëlya")).toBe("caelya");
  });
  it("trims punctuation and collapses separators", () => {
    expect(slugify("  Allicyone !! Live  ")).toBe("allicyone-live");
  });
  it("returns empty string for punctuation-only input", () => {
    expect(slugify("!!!")).toBe("");
  });
});

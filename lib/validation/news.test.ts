import { describe, it, expect } from "vitest";
import { newsSchema, createNewsSchema } from "./news";

describe("newsSchema", () => {
  const valid = {
    title: "Nouvelle signature",
    excerpt: "Un chapô.",
    body: "Le corps de l'article.",
    category: "Signature",
    date: "2026-06-09",
  };
  it("accepts a valid article and trims title", () => {
    const r = newsSchema.safeParse({ ...valid, title: "  Nouvelle signature  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.title).toBe("Nouvelle signature");
  });
  it("rejects an empty title", () => {
    expect(newsSchema.safeParse({ ...valid, title: "  " }).success).toBe(false);
  });
  it("rejects a malformed date", () => {
    expect(newsSchema.safeParse({ ...valid, date: "09/06/2026" }).success).toBe(false);
  });
  it("defaults excerpt/body/category to empty string", () => {
    const r = newsSchema.safeParse({ title: "T", date: "2026-06-09" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.excerpt).toBe("");
      expect(r.data.body).toBe("");
      expect(r.data.category).toBe("");
    }
  });
});

describe("createNewsSchema", () => {
  it("requires only a title", () => {
    expect(createNewsSchema.safeParse({ title: "T" }).success).toBe(true);
  });
  it("rejects an empty title", () => {
    expect(createNewsSchema.safeParse({ title: "  " }).success).toBe(false);
  });
});

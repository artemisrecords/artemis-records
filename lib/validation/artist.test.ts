import { describe, it, expect } from "vitest";
import {
  identitySchema,
  bioSchema,
  discoItemSchema,
  showSchema,
  embedSchema,
  createArtistSchema,
} from "./artist";

describe("identitySchema", () => {
  const valid = {
    name: "Nova",
    tagline: "Pop onirique",
    genre: "Pop",
    signedYear: "2026",
    primaryColor: "#cc2244",
    quote: "",
    genres: ["Pop", "Folk"],
  };
  it("accepts a valid identity and trims name", () => {
    const r = identitySchema.safeParse({ ...valid, name: "  Nova  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("Nova");
  });
  it("rejects an empty name", () => {
    expect(identitySchema.safeParse({ ...valid, name: "  " }).success).toBe(false);
  });
  it("rejects an invalid hex color", () => {
    expect(identitySchema.safeParse({ ...valid, primaryColor: "rouge" }).success).toBe(false);
  });
  it("allows an empty color", () => {
    expect(identitySchema.safeParse({ ...valid, primaryColor: "" }).success).toBe(true);
  });
});

describe("bioSchema", () => {
  it("rejects a short bio over 280 chars", () => {
    const r = bioSchema.safeParse({ bioShort: "x".repeat(281), bioLong: "ok" });
    expect(r.success).toBe(false);
  });
  it("accepts valid bios", () => {
    expect(bioSchema.safeParse({ bioShort: "court", bioLong: "long" }).success).toBe(true);
  });
});

describe("discoItemSchema", () => {
  const valid = { id: "d1", kind: "Album", title: "Aurore", year: "2025", cover: "https://x/y.jpg", note: "" };
  it("accepts a valid item", () => {
    expect(discoItemSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects a non-url cover", () => {
    expect(discoItemSchema.safeParse({ ...valid, cover: "y.jpg" }).success).toBe(false);
  });
});

describe("showSchema", () => {
  const valid = { date: "2026-07-01", city: "Paris", venue: "La Cigale", status: "Complet", free: false, ticketUrl: "" };
  it("accepts a valid show", () => {
    expect(showSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects a malformed date", () => {
    expect(showSchema.safeParse({ ...valid, date: "01/07/2026" }).success).toBe(false);
  });
});

describe("embedSchema", () => {
  it("accepts spotify/youtube only", () => {
    expect(embedSchema.safeParse({ type: "spotify", title: "T", src: "https://open.spotify.com/x" }).success).toBe(true);
    expect(embedSchema.safeParse({ type: "soundcloud", title: "T", src: "https://x/y" }).success).toBe(false);
  });
});

describe("createArtistSchema", () => {
  it("requires only a name", () => {
    expect(createArtistSchema.safeParse({ name: "Nova" }).success).toBe(true);
  });
  it("rejects an empty name", () => {
    expect(createArtistSchema.safeParse({ name: "  " }).success).toBe(false);
  });
});

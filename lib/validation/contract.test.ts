import { describe, it, expect } from "vitest";
import {
  CONTRACT_STATUSES,
  contractStatusSchema,
  createContractSchema,
  updateContractSchema,
} from "./contract";

const valid = {
  title: "Contrat d'artiste · Allicyone",
  party: "Allicyone",
  type: "Contrat d'artiste · 3 ans",
  startDate: "2024-03-01",
  endDate: "2027-02-28",
  amount: "-",
  status: "en_cours" as const,
  notes: "RAS",
  signedBy: ["Allicyone", "M. Villeneuve"],
};

describe("contractStatusSchema", () => {
  it("accepts the four known statuses", () => {
    for (const s of CONTRACT_STATUSES) {
      expect(contractStatusSchema.safeParse(s).success).toBe(true);
    }
  });
  it("rejects an unknown status", () => {
    expect(contractStatusSchema.safeParse("brouillon").success).toBe(false);
  });
});

describe("createContractSchema", () => {
  it("accepts a valid contract and trims the title", () => {
    const r = createContractSchema.safeParse({ ...valid, title: "  T  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.title).toBe("T");
  });
  it("rejects an empty title or party", () => {
    expect(createContractSchema.safeParse({ ...valid, title: " " }).success).toBe(false);
    expect(createContractSchema.safeParse({ ...valid, party: " " }).success).toBe(false);
  });
  it("rejects a malformed date", () => {
    expect(createContractSchema.safeParse({ ...valid, startDate: "01/03/2024" }).success).toBe(
      false,
    );
  });
  it("rejects endDate before startDate", () => {
    expect(
      createContractSchema.safeParse({ ...valid, startDate: "2027-01-01", endDate: "2026-01-01" })
        .success,
    ).toBe(false);
  });
  it("coerces empty artistId to undefined", () => {
    const r = createContractSchema.safeParse({ ...valid, artistId: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.artistId).toBeUndefined();
  });
  it("defaults amount, status, signedBy when omitted", () => {
    const r = createContractSchema.safeParse({
      title: "T",
      party: "P",
      type: "Type",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.amount).toBe("");
      expect(r.data.status).toBe("a_signer");
      expect(r.data.signedBy).toEqual([]);
      expect(r.data.artistId).toBeUndefined();
    }
  });
});

describe("updateContractSchema", () => {
  it("accepts the same shape as create", () => {
    expect(updateContractSchema.safeParse(valid).success).toBe(true);
  });
  it("still enforces date ordering", () => {
    expect(
      updateContractSchema.safeParse({ ...valid, startDate: "2027-01-01", endDate: "2026-01-01" })
        .success,
    ).toBe(false);
  });
});

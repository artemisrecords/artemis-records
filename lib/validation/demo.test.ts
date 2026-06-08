import { describe, it, expect } from "vitest";
import { demoSubmissionSchema } from "./demo";

const valid = {
  artist: "Nova",
  contact: "Jean Dupont",
  email: "Jean@Exemple.FR",
  listenUrl: "https://soundcloud.com/nova",
  socials: "@nova",
  pitch: "Trois titres pop.",
};

describe("demoSubmissionSchema", () => {
  it("accepte une soumission complète et trim/normalise", () => {
    const r = demoSubmissionSchema.safeParse({ ...valid, artist: "  Nova  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.artist).toBe("Nova");
  });

  it("rend socials et pitch optionnels (défaut chaîne vide)", () => {
    const { socials, pitch, ...rest } = valid;
    const r = demoSubmissionSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.socials).toBe("");
      expect(r.data.pitch).toBe("");
    }
  });

  it("rejette un courriel invalide", () => {
    const r = demoSubmissionSchema.safeParse({ ...valid, email: "pasunemail" });
    expect(r.success).toBe(false);
  });

  it("rejette un lien d'écoute non-URL", () => {
    const r = demoSubmissionSchema.safeParse({ ...valid, listenUrl: "soundcloud" });
    expect(r.success).toBe(false);
  });

  it("rejette un nom d'artiste vide", () => {
    const r = demoSubmissionSchema.safeParse({ ...valid, artist: "   " });
    expect(r.success).toBe(false);
  });
});

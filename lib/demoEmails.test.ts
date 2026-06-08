import { describe, it, expect } from "vitest";
import {
  demoReceiptArtist,
  demoNewLabel,
  demoDecisionLabel,
  demoDecisionArtistDefaults,
  wrapArtistHtml,
} from "./demoEmails";

describe("demoEmails", () => {
  it("accusé réception : nomme l'artiste, html + text non vides", () => {
    const m = demoReceiptArtist("Nova");
    expect(m.subject.length).toBeGreaterThan(0);
    expect(m.text).toContain("Nova");
    expect(m.html).toContain("Nova");
  });

  it("notif label : inclut artiste, contact et le lien backoffice", () => {
    const m = demoNewLabel({
      artist: "Nova",
      contact: "Jean Dupont",
      email: "jean@exemple.fr",
      backofficeUrl: "http://localhost:3000/backoffice/demos",
    });
    expect(m.text).toContain("Nova");
    expect(m.text).toContain("Jean Dupont");
    expect(m.html).toContain("http://localhost:3000/backoffice/demos");
  });

  it("défauts décision : sujet+corps distincts selon retenu/refuse", () => {
    const ok = demoDecisionArtistDefaults("Nova", "retenu");
    const ko = demoDecisionArtistDefaults("Nova", "refuse");
    expect(ok.body).toContain("Nova");
    expect(ko.body).toContain("Nova");
    expect(ok.subject).not.toBe(ko.subject);
  });

  it("récap label : mentionne décision et décideur", () => {
    const m = demoDecisionLabel({
      artist: "Nova",
      decision: "retenu",
      deciderName: "Margaux",
    });
    expect(m.text).toContain("Nova");
    expect(m.text).toContain("Margaux");
  });

  it("wrapArtistHtml : transforme les paragraphes texte en HTML", () => {
    const html = wrapArtistHtml("Sujet", "Bonjour,\n\nMerci.");
    expect(html).toContain("Bonjour,");
    expect(html).toContain("Merci.");
    expect(html).toContain("<");
  });

  it("échappe le HTML dans le texte fourni", () => {
    const m = demoReceiptArtist("Evil <b>x</b>");
    expect(m.html).toContain("&lt;b&gt;");
    expect(m.html).not.toContain("<b>x</b>");

    const label = demoNewLabel({
      artist: "Nova",
      contact: "Jean",
      email: "jean@exemple.fr",
      backofficeUrl: 'http://x/"onmouseover="alert(1)',
    });
    expect(label.html).toContain("&quot;");
    expect(label.html).not.toContain('"onmouseover="alert(1)');
  });
});

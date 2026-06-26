import { describe, it, expect } from "vitest";
import { parseEmbedUrl } from "./embeds";

describe("parseEmbedUrl — Spotify", () => {
  it("reformate un lien de partage album avec préfixe intl et ?si", () => {
    expect(
      parseEmbedUrl(
        "https://open.spotify.com/intl-fr/album/0T5qEo7UssRa1mnRR0LGx9?si=2MHjlSJJQtWFlm6QqlqlyQ",
      ),
    ).toEqual({
      type: "spotify",
      src: "https://open.spotify.com/embed/album/0T5qEo7UssRa1mnRR0LGx9",
    });
  });

  it("gère un lien track sans préfixe intl", () => {
    expect(parseEmbedUrl("https://open.spotify.com/track/19pmxKlRw5FnuRNX3mXrZ7")).toEqual({
      type: "spotify",
      src: "https://open.spotify.com/embed/track/19pmxKlRw5FnuRNX3mXrZ7",
    });
  });

  it("gère playlist, artist, episode, show", () => {
    expect(parseEmbedUrl("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M")?.src).toBe(
      "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M",
    );
    expect(parseEmbedUrl("https://open.spotify.com/artist/285mwpEqyCKT0Y3liIdR0q")?.src).toBe(
      "https://open.spotify.com/embed/artist/285mwpEqyCKT0Y3liIdR0q",
    );
    expect(parseEmbedUrl("https://open.spotify.com/episode/512ojhOuo1ktJprKbVcKyQ")?.src).toBe(
      "https://open.spotify.com/embed/episode/512ojhOuo1ktJprKbVcKyQ",
    );
    expect(parseEmbedUrl("https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk")?.src).toBe(
      "https://open.spotify.com/embed/show/4rOoJ6Egrf8K2IrywzwOMk",
    );
  });

  it("est idempotent sur un lien déjà en /embed/", () => {
    expect(
      parseEmbedUrl("https://open.spotify.com/embed/album/668VWNUYAvVY6tKggLNDh8")?.src,
    ).toBe("https://open.spotify.com/embed/album/668VWNUYAvVY6tKggLNDh8");
  });

  it("gère une URI spotify:", () => {
    expect(parseEmbedUrl("spotify:album:0T5qEo7UssRa1mnRR0LGx9")).toEqual({
      type: "spotify",
      src: "https://open.spotify.com/embed/album/0T5qEo7UssRa1mnRR0LGx9",
    });
  });
});

describe("parseEmbedUrl — YouTube", () => {
  it("gère watch?v= avec params parasites", () => {
    expect(
      parseEmbedUrl("https://www.youtube.com/watch?v=xw0BKRUgV78&list=PLabc&t=10s"),
    ).toEqual({ type: "youtube", src: "https://www.youtube.com/embed/xw0BKRUgV78" });
  });

  it("gère youtu.be avec ?si", () => {
    expect(parseEmbedUrl("https://youtu.be/QVJS9At8xAQ?si=abcd")).toEqual({
      type: "youtube",
      src: "https://www.youtube.com/embed/QVJS9At8xAQ",
    });
  });

  it("gère shorts/ et embed/", () => {
    expect(parseEmbedUrl("https://www.youtube.com/shorts/xw0BKRUgV78")?.src).toBe(
      "https://www.youtube.com/embed/xw0BKRUgV78",
    );
    expect(parseEmbedUrl("https://www.youtube.com/embed/xw0BKRUgV78")?.src).toBe(
      "https://www.youtube.com/embed/xw0BKRUgV78",
    );
  });

  it("gère music.youtube.com", () => {
    expect(parseEmbedUrl("https://music.youtube.com/watch?v=xw0BKRUgV78")?.src).toBe(
      "https://www.youtube.com/embed/xw0BKRUgV78",
    );
  });
});

describe("parseEmbedUrl — invalides", () => {
  it("renvoie null pour un domaine inconnu ou une chaîne vide", () => {
    expect(parseEmbedUrl("https://soundcloud.com/foo/bar")).toBeNull();
    expect(parseEmbedUrl("")).toBeNull();
    expect(parseEmbedUrl("   ")).toBeNull();
    expect(parseEmbedUrl("pas une url")).toBeNull();
  });
});

export type EmbedType = "spotify" | "youtube";
export type ParsedEmbed = { type: EmbedType; src: string };

const SPOTIFY_TYPES = "album|track|playlist|artist|episode|show";
// Tolère le préfixe /intl-xx, un /embed/ déjà présent, et la query ?si=…
const SPOTIFY_URL_RE = new RegExp(
  `open\\.spotify\\.com/(?:intl-[a-z-]+/)?(?:embed/)?(${SPOTIFY_TYPES})/([A-Za-z0-9]+)`,
  "i",
);
const SPOTIFY_URI_RE = new RegExp(`^spotify:(${SPOTIFY_TYPES}):([A-Za-z0-9]+)$`, "i");

// Un id YouTube fait 11 caractères [A-Za-z0-9_-].
const YOUTUBE_RES: RegExp[] = [
  /youtu\.be\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/(?:watch\?(?:[^#]*&)?v=)([A-Za-z0-9_-]{11})/,
  /youtube\.com\/(?:embed|shorts|v)\/([A-Za-z0-9_-]{11})/,
];

/** Reformate n'importe quel lien Spotify/YouTube en URL d'embed, ou null. */
export function parseEmbedUrl(raw: string): ParsedEmbed | null {
  const input = raw.trim();
  if (!input) return null;

  const uri = input.match(SPOTIFY_URI_RE);
  if (uri) {
    return {
      type: "spotify",
      src: `https://open.spotify.com/embed/${uri[1].toLowerCase()}/${uri[2]}`,
    };
  }

  const sp = input.match(SPOTIFY_URL_RE);
  if (sp) {
    return {
      type: "spotify",
      src: `https://open.spotify.com/embed/${sp[1].toLowerCase()}/${sp[2]}`,
    };
  }

  for (const re of YOUTUBE_RES) {
    const m = input.match(re);
    if (m) {
      return { type: "youtube", src: `https://www.youtube.com/embed/${m[1]}` };
    }
  }

  return null;
}

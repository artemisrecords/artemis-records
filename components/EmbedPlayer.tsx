import type { Embed } from "@/lib/data";
import { Eyebrow } from "./Primitives";

export const EmbedPlayer = ({ embed }: { embed: Embed }) => {
  if (embed.type === "spotify") {
    return (
      <div className="w-full max-w-[800px] mx-auto">
        <div className="flex justify-between items-center pb-3">
          <Eyebrow className="!text-magenta">Spotify</Eyebrow>
          <span className="text-[11px] italic text-ink-muted">
            {embed.title}
          </span>
        </div>
        <iframe
          src={embed.src}
          width="100%"
          height={152}
          allow="autoplay; clipboard-write; encrypted-media"
          loading="lazy"
          className="block border-0 rounded-xl"
        />
      </div>
    );
  }
  if (embed.type === "youtube") {
    return (
      <div className="bg-bleu-nuit-700 w-full max-w-[800px] mx-auto">
        <div className="flex justify-between items-center px-4.5 py-3.5">
          <Eyebrow inverse className="!text-magenta">
            YouTube
          </Eyebrow>
          <span className="text-[11px] italic text-beige-sable/75">
            {embed.title}
          </span>
        </div>
        <iframe
          src={embed.src}
          width="100%"
          className="block border-0 aspect-video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }
  return null;
};

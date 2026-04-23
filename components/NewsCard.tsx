import Link from "next/link";
import { formatDate, type NewsItem } from "@/lib/data";
import { Eyebrow } from "./Primitives";

export const NewsCard = ({
  news,
  inverse = false,
}: {
  news: NewsItem;
  inverse?: boolean;
}) => (
  <Link href={`/news/${news.id}`} className="block cursor-pointer">
    <div
      className="grain h-[200px] mb-3.5"
      style={{ background: `center/cover no-repeat url(${news.image})` }}
    />
    <Eyebrow inverse={inverse} className="!text-magenta">
      {news.category} · {formatDate(news.date)}
    </Eyebrow>
    <h3
      className={`font-display uppercase tracking-display text-[22px] my-2 font-normal ${
        inverse ? "text-beige-sable" : "text-ink"
      }`}
    >
      {news.title}
    </h3>
    <p
      className={`italic text-[13px] leading-[1.55] m-0 ${
        inverse ? "text-beige-sable/75" : "text-ink-muted"
      }`}
    >
      {news.excerpt}
    </p>
  </Link>
);

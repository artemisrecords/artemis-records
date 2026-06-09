import "server-only";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { news } from "./schema";
import { slugify } from "@/lib/slug";

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "article";
  let candidate = root;
  let n = 2;
  while (true) {
    const [hit] = await db
      .select({ id: news.id })
      .from(news)
      .where(eq(news.id, candidate))
      .limit(1);
    if (!hit) return candidate;
    candidate = `${root}-${n++}`;
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createNews(input: {
  title: string;
  slug?: string;
  category?: string;
  date?: string;
}): Promise<string> {
  const id = await uniqueSlug(input.slug && input.slug.length > 0 ? input.slug : input.title);
  await db.insert(news).values({
    id,
    published: false,
    date: input.date && input.date.length > 0 ? input.date : today(),
    category: input.category ?? "",
    title: input.title,
    excerpt: "",
    body: "",
    imageUrl: "",
  });
  return id;
}

export async function updateNews(
  id: string,
  data: { title: string; excerpt: string; body: string; category: string; date: string },
): Promise<void> {
  await db
    .update(news)
    .set({
      title: data.title,
      excerpt: data.excerpt,
      body: data.body,
      category: data.category,
      date: data.date,
      updatedAt: new Date(),
    })
    .where(eq(news.id, id));
}

export async function setNewsImage(id: string, imageUrl: string): Promise<void> {
  await db
    .update(news)
    .set({ imageUrl, updatedAt: new Date() })
    .where(eq(news.id, id));
}

export async function setPublished(id: string, published: boolean): Promise<void> {
  await db
    .update(news)
    .set({ published, updatedAt: new Date() })
    .where(eq(news.id, id));
}

export async function deleteNews(id: string): Promise<void> {
  await db.delete(news).where(eq(news.id, id));
}

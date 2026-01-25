import { desc, eq } from "drizzle-orm";
import { db } from "../index.ts";
import { feedFollows, feeds, posts } from "../schema.ts";

export async function createPost(
  feedId: string,
  title: string,
  url: string,
  publishedAt: Date,
  description?: string,
) {
  const [result] = await db
    .insert(posts)
    .values({ feedId, title, url, publishedAt, description })
    .returning();
  return result;
}

export async function getPostsForUsers(userId: string, limit: number) {
  const result = await db
    .select({
      id: posts.id,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      title: posts.title,
      url: posts.url,
      description: posts.description,
      publishedAt: posts.publishedAt,
      feedId: posts.feedId,
      feedName: feeds.name,
    })
    .from(posts)
    .innerJoin(feedFollows, eq(posts.feedId, feedFollows.feedId))
    .innerJoin(feeds, eq(posts.feedId, feeds.id))
    .where(eq(feedFollows.userId, userId))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
  return result;
}

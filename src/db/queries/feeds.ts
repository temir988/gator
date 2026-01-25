import { and, eq, sql } from "drizzle-orm";
import { db } from "../index.ts";
import { feedFollows, feeds, users } from "../schema.ts";

export async function createFeed(name: string, url: string, userId: string) {
  const [result] = await db
    .insert(feeds)
    .values({ name, url, userId })
    .returning();
  return result;
}

export async function getFeedsFull() {
  const result = await db
    .select()
    .from(feeds)
    .leftJoin(users, eq(feeds.userId, users.id));
  return result;
}

export async function getFeedByUrl(url: string) {
  const [result] = await db.select().from(feeds).where(eq(feeds.url, url));
  return result;
}

export async function markFeedFetched(feedId: string) {
  await db
    .update(feeds)
    .set({ updatedAt: sql`NOW()`, lastFetchedAt: sql`NOW()` })
    .where(eq(feeds.id, feedId));
}

export async function getNextFeedToFetch() {
  const [res] = await db.execute(
    sql`SELECT * FROM ${feeds} ORDER BY ${feeds.lastFetchedAt} NULLS FIRST LIMIT 1`,
  );
  return res;
}

export async function deleteFeedFollow(userId: string, feedId: string) {
  await db
    .delete(feedFollows)
    .where(and(eq(feedFollows.feedId, feedId), eq(feedFollows.userId, userId)));
}

export async function createFeedFollow(userId: string, feedId: string) {
  const [newFeedFollow] = await db
    .insert(feedFollows)
    .values({ userId, feedId })
    .returning();

  const [result] = await db
    .select({
      id: feedFollows.id,
      createdAt: feedFollows.createdAt,
      updatedAT: feedFollows.updatedAt,
      userId: feedFollows.userId,
      feedId: feedFollows.feedId,
      feedName: feeds.name,
      userName: users.name,
    })
    .from(feedFollows)
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .where(
      and(
        eq(feedFollows.id, newFeedFollow.id),
        eq(users.id, newFeedFollow.userId),
      ),
    );

  return result;
}

export async function getFeedFollowsForUser(userId: string) {
  const result = await db
    .select()
    .from(feeds)
    .leftJoin(feedFollows, eq(feeds.id, feedFollows.feedId))
    .where(eq(feedFollows.userId, userId));
  return result;
}

import { eq } from "drizzle-orm";
import { db } from "../index.ts";
import { feeds } from "../schema.ts";

export async function createFeed(name: string, url: string, userId: string) {
  const [result] = await db
    .insert(feeds)
    .values({ name, url, userId })
    .returning();
  return result;
}

import { eq } from "drizzle-orm";
import { db } from "../index.ts";
import { users } from "../schema.ts";

export async function createUser(name: string) {
  const [result] = await db.insert(users).values({ name: name }).returning();
  return result;
}

export async function getUserByName(name: string) {
  const [result] = await db.select().from(users).where(eq(users.name, name));
  return result;
}

export async function getUsers() {
  const result = await db.select().from(users);
  return result;
}

export async function resetUsers() {
  await db.delete(users);
}

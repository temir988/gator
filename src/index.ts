import { argv, exit } from "node:process";
import { readConfig, setUser } from "./config.ts";
import {
  createUser,
  getUserByName,
  getUsers,
  resetUsers,
} from "./db/queries/users.ts";
import { fetchFeed } from "./rss.ts";
import {
  createFeed,
  createFeedFollow,
  deleteFeedFollow,
  getFeedByUrl,
  getFeedFollowsForUser,
  getFeedsFull,
  getNextFeedToFetch,
  markFeedFetched,
} from "./db/queries/feeds.ts";
import type { Feed, User } from "./db/schema.ts";
import type { CommandHandler, CommandsRegistry } from "./types.ts";
import { middlewareLoggedIn } from "./middleware.ts";
import { createPost, getPostsForUsers } from "./db/queries/posts.ts";

async function main() {
  const registry: CommandsRegistry = {};
  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerGetUsers);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "feeds", handlerFeeds);
  registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
  registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
  registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnFollow));
  registerCommand(
    registry,
    "following",
    middlewareLoggedIn(handlerShowFollows),
  );
  registerCommand(registry, "browse", middlewareLoggedIn(handlerBrowse));

  if (argv.length < 3) {
    console.error("Expect at least 1 argument");
    exit(1);
  }

  const [_, __, command, ...args] = argv;
  try {
    await runCommand(registry, command, ...args);
  } catch (e) {
    console.error(e);
    exit(1);
  }

  exit(0);
}

main();

async function handlerLogin(cmdName: string, ...args: string[]) {
  if (args.length < 1) {
    throw new Error("Expect one argument");
  }
  const name = args[0];
  try {
    const user = await getUserByName(name);
    setUser(user.name);
    console.log("User has been set.");
  } catch (e) {
    throw new Error("User does not exist");
  }
}

async function handlerRegister(cmdName: string, ...args: string[]) {
  if (args.length < 1) {
    throw new Error("Expect one argument");
  }
  const username = args[0];
  try {
    const user = await createUser(username);
    setUser(user.name);
    console.log("User has been register:", user);
  } catch (e) {
    throw new Error("User already exists");
  }
}

async function handlerFollow(cmdName: string, user: User, ...args: string[]) {
  if (args.length < 1) {
    throw new Error(`usage: ${cmdName} <url>`);
  }
  const url = args[0];
  const feed = await getFeedByUrl(url);

  if (!feed) {
    throw new Error(`Feed not found: ${url}`);
  }

  const follows = await createFeedFollow(user.id, feed.id);
  console.log(`Feed follow created:`);
  console.log(`* User: ${follows.userName}`);
  console.log(`* Feed: ${follows.feedName}`);
}

async function handlerUnFollow(cmdName: string, user: User, ...args: string[]) {
  if (args.length < 1) {
    throw new Error(`usage: ${cmdName} <url>`);
  }
  const url = args[0];
  const feed = await getFeedByUrl(url);

  if (!feed) {
    throw new Error(`Feed not found: ${url}`);
  }

  await deleteFeedFollow(user.id, feed.id);
  console.log(`Feed follow deleted:`);
}

async function handlerAddFeed(cmdName: string, user: User, ...args: string[]) {
  if (args.length < 2) {
    throw new Error(`usage: ${cmdName} <feed_name> <url>`);
  }

  const [feedName, url] = args;
  const data = await fetchFeed(url);
  if (!data) {
    throw new Error(`Failed to create feed`);
  }
  const feed = await createFeed(feedName, url, user.id);
  await createFeedFollow(user.id, feed.id);
  console.log(`* name:          ${feed.name}`);
  console.log(`* User:          ${user.name}`);
}

function printFeed(feed: Feed, user: User | null) {
  console.log(`* ID:            ${feed.id}`);
  console.log(`* Created:       ${feed.createdAt}`);
  console.log(`* Updated:       ${feed.updatedAt}`);
  console.log(`* name:          ${feed.name}`);
  console.log(`* URL:           ${feed.url}`);
  console.log(`* User:          ${user?.name}`);
}

async function handlerReset(cmdName: string, ...args: string[]) {
  try {
    await resetUsers();
    setUser("");
    console.log("Users has been deleted!");
  } catch (e) {
    throw new Error("Can't reset users table");
  }
}

async function handlerGetUsers(cmdName: string, ...args: string[]) {
  const cfg = readConfig();

  try {
    const users = await getUsers();
    for (const user of users) {
      if (user.name === cfg.currentUserName) {
        console.log(`* ${user.name} (current)`);
      } else {
        console.log(`* ${user.name}`);
      }
    }
  } catch (e) {
    throw new Error("Can't get users");
  }
}

async function handlerFeeds(cmdName: string, ...args: string[]) {
  try {
    const res = await getFeedsFull();
    for (const { feeds, users } of res) {
      printFeed(feeds, users);
      console.log("=========");
    }
  } catch (e) {
    throw new Error("Can't get feeds");
  }
}

async function handlerShowFollows(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  const follows = await getFeedFollowsForUser(user.id);
  console.log(`User ${user.name} is following: `);
  for (const { feeds } of follows) {
    console.log(`* Feed:   ${feeds.name}`);
  }
}

async function handlerAgg(cmdName: string, ...args: string[]) {
  if (args.length < 1) {
    throw new Error(`usage: ${cmdName} <time_between_requests>`);
  }
  const [time] = args;
  const timeBetweenRequests = parseDuration(time);
  scrapeFeeds().catch((e) => console.log(e));

  const interval = setInterval(() => {
    scrapeFeeds().catch((e) => console.log(e));
  }, timeBetweenRequests);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}

function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);

  if (!match) {
    throw new Error(`Invalid duration: ${durationStr}`);
  }

  console.log(`Collecting feeds every ${durationStr}`);

  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
  } as const;

  const value = parseInt(match[1]);
  const unit = match[2] as keyof typeof multipliers;

  return value * multipliers[unit];
}

async function scrapeFeeds() {
  const nextFeed = (await getNextFeedToFetch()) as any as Feed;
  console.log(nextFeed);
  await markFeedFetched(nextFeed.id);
  const feed = await fetchFeed(nextFeed.url);
  //Iterate over the items
  console.log("Posts from: ", nextFeed.url);
  for (let item of feed.channel.item) {
    const post = await createPost(
      nextFeed.id,
      item.title,
      item.link,
      new Date(item.pubDate),
      item.description,
    );
    console.log(post);
  }
}

async function handlerBrowse(cmdName: string, user: User, ...args: string[]) {
  const limit = parseInt(args[0]) || 2;
  const posts = await getPostsForUsers(user.id, limit);
  for (let post of posts) {
    console.log(`* Title:            ${post.title}`);
    console.log(`* description:      ${post.description}`);
  }
}

function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler,
) {
  registry[cmdName] = handler;
}

async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
) {
  if (!registry[cmdName]) {
    throw new Error("command not found");
  }
  await registry[cmdName](cmdName, ...args);
}

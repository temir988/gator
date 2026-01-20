import { argv, exit } from "node:process";
import { readConfig, setUser } from "./config.ts";
import {
  createUser,
  getUserByName,
  getUsers,
  resetUsers,
} from "./db/queries/users.ts";
import { fetchFeed } from "./rss.ts";
import { createFeed, getFeedsFull } from "./db/queries/feeds.ts";
import type { Feed, User } from "./db/schema.ts";

type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

type CommandsRegistry = Record<string, CommandHandler>;

async function main() {
  const registry: CommandsRegistry = {};
  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerGetUsers);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "addfeed", handlerAddFeed);
  registerCommand(registry, "feeds", handlerFeeds);

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

async function handlerAddFeed(cmdName: string, ...args: string[]) {
  if (args.length < 2) {
    throw new Error(`usage: ${cmdName} <feed_name> <url>`);
  }
  const cfg = readConfig();
  const user = await getUserByName(cfg.currentUserName);
  if (!user) {
    throw new Error(`User ${cfg.currentUserName} not found`);
  }

  const [feedName, url] = args;
  const data = await fetchFeed(url);
  if (!data) {
    throw new Error(`Failed to create feed`);
  }
  const res = await createFeed(feedName, url, user.id);
  printFeed(res, user);
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

async function handlerAgg(cmdName: string, ...args: string[]) {
  try {
    const data = await fetchFeed("https://www.wagslane.dev/index.xml");
    console.log(data);
  } catch (e) {
    throw new Error("Can't get feed");
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

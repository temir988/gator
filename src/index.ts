import { argv, exit } from "node:process";
import { readConfig, setUser } from "./config.ts";

type CommandHandler = (cmdName: string, ...args: string[]) => void;

type CommandsRegistry = Record<string, CommandHandler>;

function main() {
  const registry: CommandsRegistry = {};
  registerCommand(registry, "login", handlerLogin);

  if (argv.length < 3) {
    console.error("Expect at least 1 argument");
    exit(1);
  }

  const [_, __, command, ...args] = argv;
  try {
    runCommand(registry, command, ...args);
  } catch (e) {
    console.error(e);
    exit(1);
  }
}

main();

function handlerLogin(cmdName: string, ...args: string[]) {
  if (args.length < 1) {
    throw new Error("Expect one argument");
  }
  const username = args[0];
  setUser(username);
  console.log("User has been set.");
}

function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler,
) {
  registry[cmdName] = handler;
}

function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
) {
  if (!registry[cmdName]) {
    throw new Error("command not found");
  }
  registry[cmdName](cmdName, ...args);
}

import { User } from "./db/schema.ts";

export type CommandHandler = (
  cmdName: string,
  ...args: string[]
) => Promise<void>;

export type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

export type MiddlewareLoggedIn = (
  handler: UserCommandHandler,
) => CommandHandler;

export type CommandsRegistry = Record<string, CommandHandler>;

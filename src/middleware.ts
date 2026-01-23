import { readConfig } from "./config.ts";
import { getUserByName } from "./db/queries/users.ts";
import type { MiddlewareLoggedIn, UserCommandHandler } from "./types.ts";

export const middlewareLoggedIn: MiddlewareLoggedIn = (
  userHandler: UserCommandHandler,
) => {
  return async (cmdName: string, ...args: string[]) => {
    const cfg = readConfig();
    if (!cfg.currentUserName) {
      throw new Error("User not logged in");
    }

    const user = await getUserByName(cfg.currentUserName);
    if (!user) {
      throw new Error(`User ${cfg.currentUserName} not found`);
    }

    await userHandler(cmdName, user, ...args);
  };
};

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type Config = {
  dbUrl: string;
  currentUserName: string;
};

export function setUser(name: string) {
  let cfg: Config;
  try {
    cfg = readConfig();
  } catch (e) {
    throw new Error("Config file does not exist");
  }

  cfg.currentUserName = name;
  writeConfig(cfg);
}

export function readConfig(): Config {
  const configFilePath = getConfigFilePath();
  if (!fs.existsSync(configFilePath)) {
    throw new Error("Config file does not exist");
  }

  const rawConfig = fs.readFileSync(configFilePath, "utf-8");
  try {
    const parsedConfig = JSON.parse(rawConfig);
    return validateConfig(parsedConfig);
  } catch (e) {
    throw new Error("Config is not valid");
  }
}

function getConfigFilePath(): string {
  return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(cfg: Config): void {
  const configFilePath = getConfigFilePath();
  const rawConfig = JSON.stringify(
    {
      db_url: cfg.dbUrl,
      current_user_name: cfg.currentUserName,
    },
    null,
    2,
  );
  fs.writeFileSync(configFilePath, rawConfig, "utf-8");
}

function validateConfig(rawConfig: any): Config {
  if (typeof rawConfig.db_url !== "string") {
    throw new Error("Invalid config: db_url must be a string");
  }

  if (typeof rawConfig.current_user_name !== "string") {
    throw new Error("Invalid config: currentUserName must be a string");
  }

  return {
    dbUrl: rawConfig.db_url,
    currentUserName: rawConfig.current_user_name,
  };
}

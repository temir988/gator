import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { readConfig } from "../config.ts";
import * as schema from "./schema.ts";

const config = readConfig();
const conn = postgres(config.dbUrl);
export const db = drizzle(conn, { schema: schema });
